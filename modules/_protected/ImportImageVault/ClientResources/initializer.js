define([
    "dojo/_base/declare",
    "epi/_Module",
    "epi-cms/plugin-area/assets-pane",
    "importiv/ImportCommand",
], function (
    declare,
    _Module,
    assetsPanePluginArea,
    ImportCommand
) {
    return declare([_Module], {
        initialize: function () {
            this.inherited(arguments);

            ImportCommand.prototype.controllerUrl = this._settings.controllerUrl
            ImportCommand.prototype.tenantUrl = this._settings.imageVaultUrl
            ImportCommand.prototype.baseUrl = this._settings.imageVaultBaseSegment

            assetsPanePluginArea.add(ImportCommand);
        }
    });
});