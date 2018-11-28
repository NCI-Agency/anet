param (
  [string]$anetversion = $( Read-Host "Input anetversion please, for example anet-2.0.27-preview1 or anet-2.1.1"),
  [string]$databaseName = "anet_training", #name of the database
  [string]$serverInstance = "\localhost\EC2AMAZ-NJSNVQB", #SQL server instance
  [string]$SQLhost = "localhost", #SQL server name
  [string]$sharedLocation = "C:\ANET_FILES", #location of ANET shared directory
  [string]$serviceName = "anet"
)

$server = $(hostname)

$anetpackage = $sharedLocation + "\Builds\" + $anetversion + ".zip"

if (Test-Path $anetpackage -PathType Leaf) 
    {
    Write-Host "Found " $anetpackage
    } 
else 
    {
    Write-Host "Can't find " $anetpackage " please verify that the path is correct and the package is in the correct place"
    exit
    }

Add-Type -AssemblyName System.IO.Compression.Filesystem
function Unzip
{
    param([string]$zipfile, [string]$outpath)
    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipfile, $outpath)
}


if (Get-Service $serviceName -ErrorAction SilentlyContinue)
{
    Write-Host "`n Service " $serviceName " detected"
    Write-Host "`n Stopping " $serviceName " service"
    Stop-Service anet
}
else
{
    Write-Host "`n service " $serviceName " does not exist. Consider installing one using a service manager such as nssm"
}

$databaseBackupFolder = $sharedLocation + "\Backups\Database\"+ $server
New-Item -ItemType directory -Force $databaseBackupFolder | out-null
$databaseBackupFile = $databaseBackupFolder+"\" + $databaseName + ".upgrade."+$anetversion+".bak"
Write-Host "`n Backing up database " $databaseName " from " $serverInstance " into " $databaseBackupFile
Invoke-Command -ComputerName $SQLhost -ScriptBlock {param ($serverInstance,$databaseName,$databaseBackupFile)Backup-SqlDatabase -ServerInstance $serverInstance -Database $databaseName -BackupFile $databaseBackupFile} -ArgumentList $serverInstance,$databaseName,$databaseBackupFile


$logsBackupFolder = $sharedLocation + "\Backups\Logs\"+ $server+"\" 
Write-Host "`n Backing up logs to " $logsBackupFolder
New-Item -ItemType directory -Force $logsBackupFolder | out-null
Copy-Item -Path "C:\ANET\logs\*" -Destination $logsBackupFolder | out-null

if (Test-Path C:\ANET\temp\) {
    Remove-Item C:\ANET\temp\ -Force -Recurse | out-null
    }
New-Item -ItemType directory -Force C:\ANET\temp\backup | out-null

Move-Item -Path "C:\ANET\bin\" -Destination "C:\ANET\temp\backup" | out-null
Move-Item -Path "C:\ANET\docs\" -Destination "C:\ANET\temp\backup" | out-null
Move-Item -Path "C:\ANET\lib\" -Destination "C:\ANET\temp\backup" | out-null

Unzip $anetpackage "C:\ANET\temp" | out-null

Move-Item -Path "C:\ANET\temp\" + $anetversion + "\*" -Destination "C:\ANET\" | out-null

cd C:\ANET | out-null

Write-Host "`n Migrating ANET Database"
C:\ANET\bin\anet.bat db migrate anet.yml

if (Get-Service $serviceName -ErrorAction SilentlyContinue)
{
    Write-Host "`n Starting service"
    Start-Service anet
}
else
{
    Write-Host "`n service " $serviceName " has not been installed. ANET needs to be started manually"
}


Write-Host "`n Cleaning up"
Remove-Item C:\ANET\temp\ -Force -Recurse | out-null

Write-Host "`n Done !!!"
