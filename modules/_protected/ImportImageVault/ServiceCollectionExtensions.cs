using EPiServer.Shell.Modules;

namespace Gosso.Optimizely.ImageVault.Downloader
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddImageVaultImport(this IServiceCollection services)
        {
            services.Configure<ProtectedModuleOptions>(
                pm =>
                {
                    if (!pm.Items.Any(i =>
                        i.Name.Equals("ImportImageVault", StringComparison.OrdinalIgnoreCase)))
                    {
                        pm.Items.Add(new ModuleDetails { Name = "ImportImageVault" });
                    }
                });

            return services;
        }
    }
}