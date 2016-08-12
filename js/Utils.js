$.fn.wrapInTag2 = function(opts) {

  var tag = opts.tag || 'strong'
    , words = opts.words || []
    , regex = RegExp(words.join('|'), 'gi') // case insensitive
    , replacement = '<'+ tag +'>$&</'+ tag +'>';

  return this.html(function() {
    return $(this).text().replace(regex, replacement);
  });
};

$.fn.wrapInTag = function (opts) {
    // http://stackoverflow.com/a/1646618
    function getText(obj) {
        return obj.textContent ? obj.textContent : obj.innerText;
    }

    var tag = opts.tag || 'strong',
        words = opts.words || [],
        regex = RegExp(words.join('|'), 'gi'),
        replacement = '<' + tag + '>$&</' + tag + '>';

    // http://stackoverflow.com/a/298758
    $(this).contents().each(function () {
        if (this.nodeType === 3) //Node.TEXT_NODE
        {
            // http://stackoverflow.com/a/7698745
            $(this).replaceWith(getText(this).replace(regex, replacement));
        }
        else if (!opts.ignoreChildNodes) {
            $(this).wrapInTag(opts);
        }
    });
};