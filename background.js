chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.method == 'updateOptions') {
    saveOptions(request.update, true);
  } else
  if (request.method == 'getOptions') {
    sendResponse(opts);
  }
});

chrome.runtime.onInstalled.addListener(function(details) {
  chrome.tabs.create({ url: 'options.html' });
});

var albumsId = {};
var photosId = {};
chrome.webRequest.onCompleted.addListener(function(details) {
  chrome.tabs.get(details.tabId, function(tab) {
    var https = (tab.url.indexOf('https:') == 0) ? 1 : 0;
    api('execute', { code: 'return { albums: API.photos.getAlbums({ owner_id: -69762228, https: ' + https + ' }), photos: API.photos.getAll({ owner_id: -69762228, count: 200, https: ' + https + ' }) };' }, function(res) {
      var stickersPhotos = {};
      var stickersAlbums = [];

      var albums = res.response.albums.items.reverse();
      for (var i = 0; i < albums.length; i++) {
        if (!albums[i].size) continue;
        albumsId[albums[i].id] = albums[i];
        stickersPhotos[albums[i].id] = { stickers: [] };
        stickersAlbums.push([albums[i].id, 1]);
      }
      var photos = res.response.photos.items.reverse();
      for (var i = 0; i < photos.length; i++) {
        photosId[photos[i].id] = photos[i];
        stickersPhotos[photos[i].album_id].stickers.push([photos[i].id, 256]);
      }

      chrome.tabs.executeScript(details.tabId, {
        code: "var e = document.createElement('script');e.src = chrome.extension.getURL('inject.js');e.onload=function(){window.postMessage(" + JSON.stringify({
          type: 'vkCustomStickers',
          photos: stickersPhotos,
          albums: stickersAlbums,
          opts: opts
        }) + ", '*');};document.body.appendChild(e);"
      });
      chrome.tabs.insertCSS(details.tabId, {
        file: 'inject.css'
      })
    });
  });
},
{
  urls: [
    "*://*.vk.me/js/al/emoji.js*",
    "*://vk.com/js/al/emoji.js*",
  ],
  types: ["script"]
});

chrome.webRequest.onBeforeRequest.addListener(function(details) {
  var m;
  if (m = details.url.match(/stickers\/(\d+)\/thumb_(\d+)\./)) { // Album thumb
    var album_id = m[1];
    var size = m[2];

    if (albumsId[album_id] && photosId[albumsId[album_id].thumb_id]) {
      return { redirectUrl: photosId[albumsId[album_id].thumb_id].photo_75 };
    }
  } else
  if (m = details.url.match(/stickers\/(\d+)\/(\d+)\./)) { // Sticker
    var photo_id = m[1];
    var size = m[2];

    if (photosId[photo_id]) {
      return { redirectUrl: photosId[photo_id].photo_75 };
    }
  }
}, {
  urls: [
    "*://vk.com/images/store/stickers/*", //vk.com/images/store/stickers/1000000/thumb_22.png
    "*://vk.com/images/stickers/*" //vk.com/images/stickers/1000000/64.png
  ],
  types: ["image"]
}, ['blocking']);