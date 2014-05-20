(function(window) {
  function num(n,cs) {
    if (!n) return cs[2];
    n = n % 100;
    if ((n % 10 == 0) || (n % 10 > 4) || (n > 4 && n < 21)) {
      return cs[2];
    } else
    if (n % 10 == 1) {
      return cs[0];
    } else {
      return cs[1];
    }
  }

  var reinjectKey = 'injected' + Math.random().toString(26).substr(2);
  function inject(orig, hook, type, noReinject) {
    if (noReinject && orig[reinjectKey]) {
      return orig;
    }
    var f = function() {
      var ret;
      if (typeof type == 'function' || type == 'before' || type == 'replace') {
        ret = hook.apply(this, arguments);
      }
      if (type == 'manual') {
        ret = hook.call(this, arguments, orig);
      } else
      if (type != 'replace') {
        ret = orig.apply(this, arguments);
      }
      if (typeof type == 'function') {
        ret = type.apply(this, [ret].concat(Array.prototype.slice.call(arguments)));
      } else
      if (!type || type == 'after') {
        ret = hook.apply(this, [ret].concat(Array.prototype.slice.call(arguments)));
      }
      return ret;
    };
    if (noReinject) {
      f[reinjectKey] = true;
    }
    return f;
  }

  var customStickers = {};
  window.addEventListener('message', function(event) {
    if (event.source != window)
      return;

    if (event.data.type && (event.data.type == 'vkCustomStickers')) {
      customStickers = event.data;
    }
  }, false);

  Emoji.ttClick = inject(Emoji.ttClick, function(ret, optId, obj, needHide, needShow, ev) {
    var opts = Emoji.opts[optId];
    if (!opts) {
      return ret;
    }

    var topShift = getSize(opts.tt)[1] + 11;
    var toParams = { marginTop: Emoji.shown ? -topShift : -(topShift+10) };
    setTimeout(setStyle.pbind(opts.tt, toParams), 10);
    return ret;
  });

  Emoji.getTabsCode = inject(Emoji.getTabsCode, function(args, func) {
    var extra = [];
    for (var i = 0; i < customStickers.albums.length; i++) {
      if (customStickers.opts['album' + customStickers.albums[i][0]]) {
        extra.push(customStickers.albums[i]);
      }
    }
    args[0] = (args[0] || []).concat(extra);
    return func.apply(this, args);
  }, 'manual', true);

  Emoji.tabSwitch = inject(Emoji.tabSwitch, function(obj, selId, optId) {
    if (!Emoji.stickers) {
      return;
    }

    for (var id in customStickers.photos) {
      Emoji.stickers[id] = customStickers.photos[id];
    }
  }, 'before', true);

  Emoji.stickerClick = inject(Emoji.stickerClick, function(args, func) {
    if (args[1] >= 1000000) {
      var oldMedias = cur.imPeerMedias[cur.peer];
      var oldText = val(ge('im_txt' + cur.peer));
      cur.imPeerMedias[cur.peer] = [['photo', '-69762228_' + args[1], 1, '<div></div>', undefined]];
      IM.send();
      cur.imPeerMedias[cur.peer] = oldMedias;
      Emoji.ttHide(args[0]);
    } else {
      return func.apply(this, args);
    }
  }, 'manual', true);
})(window);