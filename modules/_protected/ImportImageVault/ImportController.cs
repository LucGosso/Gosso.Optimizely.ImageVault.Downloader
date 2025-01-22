using EPiServer;
using EPiServer.Cms.Shell;
using EPiServer.Core;
using EPiServer.DataAbstraction;
using EPiServer.DataAccess;
using EPiServer.Framework.Blobs;
using EPiServer.Security;
using EPiServer.Shell.Configuration;
using EPiServer.Web;
using ImageVault.Client;
using ImageVault.Client.Descriptors;
using ImageVault.Common.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gosso.Optimizely.ImageVault.Downloader
{
    /// <summary>
    /// Controller used to download media from Imagevault
    /// </summary>
    [Route("{firstSegment}/importimagevault/[controller]/[action]")]//in some solution, this is not needed
    public class ImportController : Controller
    {
        private readonly IContentRepository contentRepository;
        private readonly ContentMediaResolver contentMediaResolver;
        private readonly IBlobFactory blobFactory;
        private readonly IUrlSegmentCreator urlSegmentCreator;
        private readonly IContentTypeRepository contentTypeRepository;
        private readonly IClientFactory imageVaultClientFactory;

        public ImportController(
            IContentRepository contentRepository,
            ContentMediaResolver contentMediaResolver,
            IBlobFactory blobFactory,
            IUrlSegmentCreator urlSegmentCreator,
            IContentTypeRepository contentTypeRepository,
            IClientFactory imageVaultClientFactory)
        {
            this.contentRepository = contentRepository;
            this.contentMediaResolver = contentMediaResolver;
            this.blobFactory = blobFactory;
            this.urlSegmentCreator = urlSegmentCreator;
            this.contentTypeRepository = contentTypeRepository;
            this.imageVaultClientFactory = imageVaultClientFactory;
        }
        ////needed for the controller to register/route
        public async Task<ContentResult> Index()
        {
            return Content("Hello World");
        }

        [HttpGet]
        public async Task<ContentResult> Test()
        {
            return Content("Hello World TEST");
        }

        [HttpPost]
        [Authorize(Roles = "CmsAdmins,CmsEditors")]
        public async Task<IActionResult> Index([FromBody] ImportImageJson image)
        {
            if (string.IsNullOrWhiteSpace(image.folderid))
            {
                return new BadRequestResult();
            }

            var media = await SaveAssetAsync(new ContentReference(image.folderid), image);
            return Content(image.folderid);
        }

        public record ImportImageJson
        {
            public string assetid { get; set; }
            public string folderid { get; set; }
            public string base64 { get; set; }
            public string name { get; set; }
        }

        private async Task<MediaData> SaveAssetAsync(ContentReference parentContentLink, ImportImageJson asset)
        {
            var fileInfo = new FileInfo(asset.name);
            var mediaType = contentMediaResolver.ListAllMatching(fileInfo.Extension).FirstOrDefault(); ;

            var contentType = contentTypeRepository.Load(mediaType);
            if (contentType == null)
            {
                var message = $"Could not find any ContentType associated to {fileInfo.Extension}";
                throw new MissingConfigurationException(message);
            }
            
            var mediaData = contentRepository.GetDefault<MediaData>(parentContentLink, contentType.ID);
            mediaData.Name = asset.name;

            var blob = blobFactory.CreateBlob(mediaData.BinaryDataContainer, fileInfo.Extension);
            // Decode the Base64 string into a byte array
            byte[] byteArray = Convert.FromBase64String(asset.base64);

            // Create a MemoryStream from the byte array
            using (MemoryStream stream = new MemoryStream(byteArray))
            {
                // Reset the position to the beginning of the stream
                stream.Position = 0;
                blob.Write(stream);
            }
                   
            mediaData.BinaryData = blob;

            mediaData.RouteSegment = urlSegmentCreator.Create(mediaData, null);

            SetAltText(mediaData, asset);

            contentRepository.Save(mediaData, SaveAction.Publish, AccessLevel.NoAccess);
            return mediaData;
        }

        private void SetAltText(MediaData mediaData, ImportImageJson asset)
        {
            if (int.TryParse(asset.assetid, out var id))
            {
                var client = imageVaultClientFactory.GetSdkClient();
                var imagevaultmedia = client.Load<MyWebImage>(id).FirstOrDefault();
                if (!string.IsNullOrEmpty(imagevaultmedia?.AltText)){
                    mediaData.SetPropertyValue("AltText", imagevaultmedia.AltText);
                }
            }
        }

        public class MyWebImage : MediaItem
        {
            [Metadata(Name = "Alt-text")]
            public string AltText { get; set; }
        }
    }
}