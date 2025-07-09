!macro NSIS_HOOK_PREINSTALL
  # Check if Git is installed
  ${If} ${FileExists} "C:\Program Files\Git\bin\bash.exe"
    # Git is already installed, continue with installation
    DetailPrint "Git is already installed. Proceeding with application installation..."
    Goto git_installed
  ${EndIf}
  
  # Git is not installed, prompt user
  MessageBox MB_YESNO "Git is required for this application to function properly.$\n$\nWould you like to download and install Git now?" IDYES install_git IDNO cancel_installation
  
  install_git:
    # Download and install Git using PowerShell
    DetailPrint "Downloading and installing Git..."
    
    # PowerShell command to download and install Git
    nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -Command "try { $ProgressPreference = \"SilentlyContinue\"; $ErrorActionPreference = \"Stop\"; Write-Host \"Downloading Git installer...\"; Invoke-WebRequest -Uri \"https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe\" -OutFile \"$env:TEMP\GitInstaller.exe\"; Write-Host \"Installing Git...\"; $process = Start-Process -FilePath \"$env:TEMP\GitInstaller.exe\" -ArgumentList \"/VERYSILENT\", \"/NORESTART\", \"/COMPONENTS=\"\"\", \"/DIR=C:\Program Files\Git\" -Wait -PassThru; if ($process.ExitCode -ne 0) { throw \"Git installer failed with exit code: $($process.ExitCode)\" }; Remove-Item \"$env:TEMP\GitInstaller.exe\" -Force -ErrorAction SilentlyContinue; Write-Host \"Git installation completed successfully.\" } catch { Write-Host \"Error: $($_.Exception.Message)\"; exit 1 }"'
    Pop $0
    
    ${If} $0 != "0"
      MessageBox MB_OK|MB_ICONSTOP "Failed to install Git. Error code: $0$\n$\nPlease install Git manually and try again."
      Abort
    ${EndIf}
    
    # Verify installation
    ${If} ${FileExists} "C:\Program Files\Git\bin\bash.exe"
      DetailPrint "Git installation verified successfully."
      Goto git_installed
    ${Else}
      MessageBox MB_OK|MB_ICONSTOP "Git installation completed but verification failed.$\n$\nPlease install Git manually and try again."
      Abort
    ${EndIf}
  
  cancel_installation:
    MessageBox MB_OK|MB_ICONINFORMATION "Installation cancelled. Git is required to install this application."
    Abort
  
  git_installed:
    DetailPrint "Git is available. Proceeding with application installation..."
!macroend
