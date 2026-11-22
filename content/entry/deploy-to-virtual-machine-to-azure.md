---
Title: AzureにBicepでVirtual Machineをデプロイする
Category:
- Azure
- Bicep
- IaC
- PowerShell
Date: 2024-06-26T11:10:42+09:00
URL: https://blog.neko3cs.net/entry/deploy-to-virtual-machine-to-azure
---

仕事でテスト環境が咄嗟に欲しくなることがあります。

社内のテスト環境はオンプレミスで限りがあったりして競合しない様に待ったりしているのがもどかしいこともあったりします。

なので、Virtual Machineをすぐに立てられるIaCコードを実装しました。

[neko3cs-lab/deploy-virtual-machine-to-azure at main · neko3cs/neko3cs-lab](https://github.com/neko3cs/neko3cs-lab/tree/main/deploy-virtual-machine-to-azure)

## コード解説

重要なところだけ説明します。

### Deploy-VirtualMachine.ps1

エントリーポイントになるスクリプトです。

```powershell
$Environ = Get-Content -Path .env | ConvertFrom-StringData
$ResourceGroup = $Environ.RESOURCE_GROUP
$Location = $Environ.LOCATION
```

設定ファイルは `.env` としました。 PowerShellには `ConvertFrom-StringData` というコマンドがあり、これで `.env` もPowerShellオブジェクトに変換できます。

```powershell
$VirtualMachineParameters = @{
  "adminUsername"    = @{ "value" = [string]$Environ.ADMIN_USERNAME };
  "adminPassword"    = @{ "value" = [string]$Environ.ADMIN_PASSWORD };
  "allowedIpAddress" = @{ "value" = [string]((Invoke-RestMethod https://domains.google.com/checkip).Trim()) };
  "OSVersion"        = @{ "value" = [string]$Environ.OS_VERSION };
  "vmSize"           = @{ "value" = [string]$Environ.VM_SIZE };
  "vmName"           = @{ "value" = [string]$Environ.VM_NAME };
  "computerName"     = @{ "value" = [string]$Environ.COMPUTER_NAME };
  "diskSizeGB"       = @{ "value" = [int]$Environ.DISK_SIZE_GB };
} |
ConvertTo-Json -Compress |
ForEach-Object { $_ -replace '"', '\"' }
```

後に実行する `az deployment group create` コマンドに引き渡す引数をJSON形式の文字列に変換しています。 直接引数を渡す方法もあるようですが、私の環境ではうまく動作せず、この方法が一番安定して動作しました。

### CreateWindowsServerVirtualMachine.bicep

デプロイ内容が記載されたBicepコードです。

ベースのコードは [Microsoft公式のQuick Start](https://learn.microsoft.com/ja-jp/azure/virtual-machines/windows/quick-create-bicep?tabs=CLI) のページにあったものになります。

```bicep
param adminUsername string
@minLength(12)
@secure()
param adminPassword string
param allowedIpAddress string
param OSVersion string
param vmSize string
param vmName string
@maxLength(15)
param computerName string
param diskSizeGB int
```

パラメーターは上記のものに絞り、あまり変更しなさそうな部分は固定値にしてしまいました。 今後利用していく中で変更が多いものはパラメーター化するかもしれません。

```bicep
resource networkSecurityGroup 'Microsoft.Network/networkSecurityGroups@2022-05-01' = {
  name: networkSecurityGroupName
  location: location
  properties: {
    securityRules: [
      {
        name: 'default-allow-3389'
        properties: {
          priority: 300
          access: 'Allow'
          direction: 'Inbound'
          destinationPortRange: '3389'
          protocol: 'Tcp'
          sourcePortRange: '*'
          sourceAddressPrefix: allowedIpAddress
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'allow-icmp'
        properties: {
          priority: 310
          access: 'Allow'
          direction: 'Inbound'
          destinationPortRange: '*'
          protocol: 'Icmp'
          sourcePortRange: '*'
          sourceAddressPrefix: allowedIpAddress
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'allow-ssh'
        properties: {
          priority: 320
          access: 'Allow'
          direction: 'Inbound'
          protocol: 'Tcp'
          destinationAddressPrefix: '*'
          destinationPortRange: '22'
          sourceAddressPrefix: allowedIpAddress
          sourcePortRange: '*'
        }
      }
    ]
  }
}
```

許可している通信をNetwork Security Groupで定義しています。 よく使うのはRDPとpingとsshかと思いますので、それを許可するようにしています。 また、一番安く運用できるセキュリティとして、デプロイしたPCのIPアドレス以外遮断するようにしています。 これで不正に仮想マシンを利用されることはないかと思います。<sup id="fnref-69dc097d"><a href="#fn-69dc097d">\*1</a></sup>

```bicep
resource vm 'Microsoft.Compute/virtualMachines@2022-03-01' = {
  name: vmName
  location: location
  properties: {
    hardwareProfile: {
      vmSize: vmSize
    }
    osProfile: {
      computerName: computerName
      adminUsername: adminUsername
      adminPassword: adminPassword
    }
    storageProfile: {
      imageReference: {
        publisher: 'MicrosoftWindowsServer'
        offer: 'WindowsServer'
        sku: OSVersion
        version: 'latest'
      }
      osDisk: {
        createOption: 'FromImage'
        managedDisk: {
          storageAccountType: 'StandardSSD_LRS'
        }
        deleteOption: 'Delete'
        diskSizeGB: diskSizeGB
      }
    }
    networkProfile: {
      networkInterfaces: [
        {
          id: nic.id
          properties: {
            deleteOption: 'Delete'
          }
        }
      ]
    }
    diagnosticsProfile: {
      bootDiagnostics: {
        enabled: true
        storageUri: storageAccount.properties.primaryEndpoints.blob
      }
    }
    securityProfile: ((securityType == 'TrustedLaunch') ? securityProfileJson : null)
  }
}
```

テストサーバーとして利用する場合は不要かと考え、 `dataDisks` の項目は削除しました。 また、 `osDisks` は引数から受け取った値で任意のサイズに変更できるようにしています。

```bicep
resource sshVmExtension 'Microsoft.Compute/virtualMachines/extensions@2022-03-01' = {
  parent: vm
  name: 'WindowsOpenSSH'
  location: location
  properties: {
    publisher: 'Microsoft.Azure.OpenSSH'
    type: 'WindowsOpenSSH'
    typeHandlerVersion: '3.0'
  }
}
```

初期設定ではSSHは有効になっていないため、この設定にてSSHを有効化します。

### Install-JapaneseLanguagePack.ps1

日本語パックをインストールするスクリプトです。

現在、Windows Server 2016でしか動作確認していないので、 2019、2022にも近いうちに対応したいと思います。

```powershell
# TODO: LanguagePackManagementモジュールを使って2019, 2022にも対応する。
# URL: https://jpwinsup.github.io/blog/2023/03/06/UserInterfaceAndApps/LanguageSupport_IME/InstallLanguage/
$LanguagePackUrl = "http://download.windowsupdate.com/c/msdownload/update/software/updt/2016/09/lp_9a666295ebc1052c4c5ffbfa18368dfddebcd69a.cab"
$LanguagePackFilePath = "$PWD\LanguagePackFile.cab"

Set-WinUserLanguageList `
  -LanguageList ja-JP, en-US `
  -Force
Start-BitsTransfer `
  -Source $LanguagePackUrl `
  -Destination $LanguagePackFilePath `
  -Priority High
Add-WindowsPackage `
  -PackagePath $LanguagePackFilePath `
  -Online
Set-WinDefaultInputMethodOverride `
  -InputTip "0411:00000411"
Set-WinLanguageBarOption `
  -UseLegacySwitchMode `
  -UseLegacyLanguageBar
Remove-Item `
  -Path $LanguagePackFilePath `
  -Force
Restart-Computer
```

### Set-JapaneseLanguageCulture.ps1

日本語環境に変更するスクリプトです。 ロケールやタイムゾーンなどを日本環境に変更します。 `Install-JapaneseLanguagePack.ps1` と合わせてこの2つを実行することでUIが日本語になり、日本語入力が可能になります。

```powershell
$GeoId = 122 # JAPAN
$TimeZone = "Tokyo Standard Time"

Set-WinCultureFromLanguageListOptOut `
  -OptOut $False
Set-WinHomeLocation `
  -GeoId $GeoId
Set-WinSystemLocale `
  -SystemLocale ja-JP
Set-WinUILanguageOverride `
  -Language ja-JP
Set-TimeZone `
  -Id $TimeZone
Restart-Computer
```

### Enable-PingFirewallRule.ps1

`ping` コマンドが通るようにするためのスクリプトです。 このスクリプトは任意です。まあ、設定しておくとサーバーが接続出来なくなった時に疎通確認などが出来ると思います。

```powershell
Get-NetFirewallRule `
  -Name FPS-ICMP4-ERQ-In |
Set-NetFirewallRule `
  -Enabled true
Get-NetFirewallRule `
  -Name FPS-ICMP6-ERQ-In |
Set-NetFirewallRule `
  -Enabled true
```

---

<span id="fn-69dc097d"></span>[*1](#fnref-69dc097d): 対策に不備があればXアカウントの方へご一報いただけると幸いです。
