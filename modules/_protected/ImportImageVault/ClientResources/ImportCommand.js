define([
    "dojo/_base/declare",
    "dojo/topic",
    "epi/shell/command/_Command",
    "epi/shell/Downloader",
    "epi/i18n!epi/cms/nls/episerver.cms.components.media"
], function (
    declare,
    topic,
    _Command,
    Downloader,
    resources
) {
    return declare([_Command], {
        label: resources.importimagevault,
        tooltip: resources.importimagevault,
        iconClass: "epi-iconDownload",
        controllerUrl: "",
        ivWindow: null,
        ivWindowCommunicating: false,
        listenerBound: false,
        winTimer: false,
        tenantUrl: "",
        baseUrl: "",

        _onModelChange: function () {
            if (this.model === null || this.model.length === 0) {
                this.set("canExecute", false);
                this.set("isAvailable", false);
                return;
            }

            if (!this._validateModels(this.model)) {
                this.set("isAvailable", false);
                return;
            }

            this.set("canExecute", true);
            this.set("isAvailable", true);
        },

        _validateModels: function (models) {
            if (!(models instanceof Array)) {
                models = [models];
            }

            if (models.length > 1)
                return false;
            var hasUnsupportedTypes = models.some(function (model) {
                return model.typeIdentifier !== "episerver.core.contentfolder" &&
                    model.typeIdentifier !== "episerver.core.contentassetfolder";
            });
            return !hasUnsupportedTypes;
        },

        _execute: function () {
            var ids = "";
            var name = "";

            if (this.model instanceof Array) {
                ids = this.model.map(function (model) {
                    return model.contentLink;
                }).join(",");
                name = "media";
            } else {
                ids = this.model.contentLink;
                name = this.model.name;
            }

            //console.log(this.model)

            if (!this.model) {
                return;
            }

            this._openImageVaultWindow();

            //Downloader.download(this.controllerUrl + "?contentFolderIds=" + ids, name + ".zip");
        },
        _createUrl: function (baseUrl) {

            // common params for all requests
            var params = {
                imageVaultBaseUrl: this.tenantUrl,
                ensurePublishingSource: location.origin,
                insertMultiple: 'false',
                formatId: 'NA',
                MediaUrlBase: baseUrl
            };

             //todo replace
             var query = Object.keys(params)
                 .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
                 .join('&');

             var ivUrl = '?' + query;
            return this.tenantUrl + "/" + ivUrl;
        },
        /*
 * Keep alive function that pings ImageVault window every second
 */
        pingIv: function () {
        if(this.ivWindowCommunicating) {
            if (this.ivWindow.opener == null) {
                // window was closed
                //this.ivWindow.opener.removeEventListener('message', messageEvent);
                this.ivWindowCommunicating = false;
                this.listenerBound = false;
                clearInterval(this.winTimer);
                this.ivWindow.close();
                return;
            }
            this.ivWindow.opener.postMessage('ping', this.tenantUrl);
        }
    },

        /*
 * Initiates the window communication, waits for initReceived
 * before accepting data.
 */
        initWindowCommunication: function (that) {

            if (that == undefined)
                that = this;

            if (!that.ivWindowCommunicating && that.ivWindow.opener) {       

                // "Hellooo, anyone there....?"
                that.ivWindow.postMessage('init', that.tenantUrl);
                setTimeout(that.initWindowCommunication, 1000, that);
            }
        },

        messageEvent: function (message) {
        // Ignore messages not for us.
        //if(message.origin !== targetOrigin) {
        //    log('Message received to another origin: (' + message.origin + ' != ' + targetOrigin + '): ' + message.data);
        //    return;
        //}

            switch (message.data) {
                case 'initReceived':
                    this.ivWindowCommunicating = true;
                    this.pingIv = this.pingIv.bind(this);
                    this.winTimer = setInterval(this.pingIv, 1000);
                    break;
                case 'close':
                    this.ivWindowCommunicating = false;
                    this.listenerBound = false;
                    clearInterval(this.winTimer);
                    this.ivWindow.close();
                    this.ivWindow.opener.removeEventListener('message', this.messageEvent);
                    break;
                default:

                    var msgData = JSON.parse(message.data);
                    this.downloadMedia(msgData);
                    break;



                //default:

            }
        },

        _openImageVaultWindow: function () {

            var ivWindowFeatures = 'width=1034,height=768,resizable=yes,scrollbars';
            var windowUrl = this._createUrl(this.baseUrl);
            var windowName = 'IvDownload_' + this.model.contentLink;

            this.ivWindow = window.open(windowUrl, windowName, ivWindowFeatures);

            if (!this.listenerBound) {
                this.messageEvent = this.messageEvent.bind(this);
                this.ivWindow.opener.addEventListener('message', this.messageEvent, false);
                this.listenerBound = true;
            }


            this.initWindowCommunication();

        },
        downloadMedia: function (media) {
            this.ivWindow.close();
            if(media) {
                // video instead of images if not Original
                //var videoConversion = media.MediaConversions.filter(function (c) {
                //    return c.ContentType.indexOf("video") !== -1;
                //});

                var ids = "";
                var name = "";

                if (this.model instanceof Array) {
                    ids = this.model.map(function (model) {
                        return model.contentLink;
                    }).join(",");
                    name = "media";
                } else {
                    ids = this.model.contentLink;
                    name = this.model.name;
                }

                //console.log(ids, name, this.tenantUrl, media.MediaConversions[0].Url, media, this.controllerUrl);


                fetch(media.MediaConversions[0].Url + '?format=base64', {
                    method: 'GET',          // Use 'POST' or other methods if needed
                    credentials: 'include', // Include cookies and authentication credentials
                    headers: {
                        'Content-Type': 'application/json' // Adjust headers if necessary
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok, image was missing on server: ' + response.statusText);
                        alert("Sorry, image was missing on server")
                    }
                    return response.text(); // or response.json() if the response is JSON
                })
                .then(base64img => {
                    //console.log('Success: sending base64 to ', this.controllerUrl);

                    //start save image

                    const data = {
                        base64: base64img,
                        folderid: ids,
                        assetid: media.Id,
                        name: media.MediaConversions[0].Name
                    };


                    fetch(this.controllerUrl, {
                        method: 'POST',      
                        credentials: 'include', // Include cookies and authentication credentials
                        headers: {
                            'Content-Type': 'application/json' // Adjust headers if necessary
                        },
                        body: JSON.stringify(data) 
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok ' + response.statusText);
                        }
                        return response.text(); // or response.json() if the response is JSON
                    })
                    .then(id => {
                        //console.log('Success: reloading ', id);

                        // Publish a message to the "/epi/cms/upload" topic
                        topic.publish("/epi/cms/upload", id);


                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });


                })
                .catch(error => {
                    console.error('Error:', error);
                });

            }
        }
    });
});