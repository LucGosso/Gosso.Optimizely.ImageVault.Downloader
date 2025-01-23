# Gosso.Optimizely.ImageVault.Downloader

This extension allows you to download images as ImageData with ContentReference from the ImageVault picker. It provides an alternative to using the ImageVault property and enables you to use the default general image media handling in Optimizely CMS.

## How it works

1. Right-click on a media folder in the media pane.
   
   ![upload](https://github.com/user-attachments/assets/92a987f9-9320-4c17-89f6-80721744213e)

3. Choose your desired image and a rendering.

![choose image](https://github.com/user-attachments/assets/5a579cfe-5af5-4d4e-80b5-1e7a868fcaff)

   
5. The image is downloaded to the media folder, and an ImageData object is created.
    - Metadata such as Alt-Text can be extracted from ImageVault
  
![AltText imported](https://github.com/user-attachments/assets/acc3a313-c73c-4f20-a6f2-942d11e02a36)

      
6. You can then use the ImageData object as a default image in the default image property or XHTML.

## Installation

1. Copy the files to the root of your website source code, keep the folder structure (/modules/_protected/ImportImageVault/ClientResources)_).
2. Use `lang.xml` for translations of the UI (set the file as an Embedded resource in the VS properties).

## Configuration (appsettings.json)

```json
"ImageVault": {
  "Client": {
    "Url": "[https://imagevault.epicweb.cloud/](https://imagevault.epicweb.cloud/)", // Important: Change this value
    "BaseSegment": "/imagevault/", // This will be added to the media request (ImportImagevault)
  }
}
```

Note: In modules.config, replace [CHANGE THIS] with your assembly name.

## Startup.cs

Register the module with the following code:

```C#

services.AddImageVaultImport();
```

This readme explains how to use the Gosso.Optimizely.ImageVault.Downloader extension to download images from ImageVault and use them in Optimizely CMS. The code snippet for startup.cs is included for easy integration.
