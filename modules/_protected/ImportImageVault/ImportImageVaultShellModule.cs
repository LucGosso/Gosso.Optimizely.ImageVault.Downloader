﻿using EPiServer.Framework.Web.Resources;
using EPiServer.ServiceLocation;
using EPiServer.Shell;
using EPiServer.Shell.Modules;

namespace Gosso.Optimizely.ImageVault.Downloader
{
    public class ImportImageVaultShellModule : ShellModule
    {
        public ImportImageVaultShellModule(string name, string routeBasePath, string resourceBasePath)
            : base(name, routeBasePath, resourceBasePath)
        {
        }

        /// <inheritdoc />
        public override ModuleViewModel CreateViewModel(ModuleTable moduleTable, IClientResourceService clientResourceService)
        {
            return new MediaDownloadModuleViewModel(this, clientResourceService);
        }
    }

    public class MediaDownloadModuleViewModel : ModuleViewModel
    {
        public MediaDownloadModuleViewModel(ShellModule shellModule, IClientResourceService clientResourceService) :
            base(shellModule, clientResourceService)
        {

            IConfiguration configuration = ServiceLocator.Current.GetInstance<IConfiguration>();
            ControllerUrl = Paths.ToResource("ImportImageVault",
                $"Import/{nameof(ImportController.Index)}");

            ImageVaultUrl = configuration["ImageVault:Client:Url"];
            ImageVaultBaseSegment = configuration["ImageVault:Client:BaseSegment"];
        }

        public string ControllerUrl { get; set; }
        public string ImageVaultUrl { get; set; }
        public string ImageVaultBaseSegment { get; set; }
    }
}