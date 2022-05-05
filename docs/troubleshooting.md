# Troubleshooting

### Unable to select CAC certificate

In some cases, tokn may provide a certificate dialog box with no valid certificates.  This cause is currently unknown.

To fix this issue, the application will need to be removed and re-installed:
1) Uninstall the app through Control Panel -> Programs -> Uninstall a program
2) Delete all files in C:\Users\%username%\AppData\Roaming\tokn
3) Download and re-install the lastest version of tokn -https://github.com/USACE/tokn/releases/latest
