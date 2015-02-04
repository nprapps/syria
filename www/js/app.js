var $container;
var $titlecard;
var $titlecard_wrapper;
var $w = $(window);
var $waypoints;
var $nav;
var $begin;
var $button_toggle_caption;
var $lightbox;
var $lightbox_image;
var $story_player_button;
var $enlarge;
var $intro_advance;
var $side_by_sides;
var $shareModal;
var aspect_width = 16;
var aspect_height = 9;
var first_page_load = true;
var firstShare = true;
var w;
var h;
var w_optimal;
var h_optimal;
var fade;
var trackedMarks = [];

var unveil_images = function() {
    /*
    * Loads images using jQuery unveil.
    * Current depth: 3x the window height.
    */
    if (Modernizr.touch) {
        // If we're on a touch device, just load all the images.
        // Seems backwards, but iOS Safari and Android have terrible scroll event
        // handling that doesn't allow unveil to progressively load images.
        $container.find('img').unveil($(document).height());
    }
    else {
        // Otherwise, start loading at 3x the window height.
        $container.find('img').unveil($w.height() * 3);
    }
};

var sub_responsive_images = function() {
    /*
    * Replaces large images with small ones for tiny devices.
    * Contains a test for non-tablet devices.
    */

    // If the window is narrow and this is a touch device ...
    if ($w.width() < 769 && Modernizr.touch === true) {

        // Loop over our images ...
        _.each($container.find('img'), function(img){

            // If the image has a data-src attribute ...
            if ($(img).attr('data-src')){

                // Sub in the responsive image from that data-src attribute.
                var responsive_image = $(img).attr('data-src').replace('.jpg', '_m.jpg');
                $(img).attr('data-src', responsive_image);
            }
        });
    }

    // Call unveil afterwards.
    unveil_images();
};

var on_window_resize = function() {
    /*
    * Handles resizing our full-width images.
    * Makes decisions based on the window size.
    */
    var w_width = $w.width();
    var w_height = $w.height();

    // Calculate optimal width if height is constrained to window height.
    w_optimal = (w_height * aspect_width) / aspect_height;

    // Calculate optimal height if width is constrained to window width.
    h_optimal = (w_width * aspect_height) / aspect_width;

    // Decide whether to go with optimal height or width.
    w = w_width;
    h = h_optimal;

    if (w_optimal > w_width) {
        w = w_optimal;
        h = w_height;
    }

    $titlecard.width(w + 'px').height(h + 'px');
    $titlecard.css('left', ((w_width - w) / 2) + 'px');
    $titlecard.css('top', ((w_height - h) / 2) + 'px');
    $titlecard_wrapper.height(w_height + 'px');
    //$opener.height($w.height() + 'px');
    $container.css('marginTop', w_height + 'px');

    // set the image grid spacing properly
    fix_image_grid_spacing();
};

var fix_image_grid_spacing = function() {
    _.each($side_by_sides, function(side_by_side) {
        if ($w.width() < 992) {
            if ($(side_by_side).next().hasClass('side-by-side-wrapper')) {
                $(side_by_side).css('margin-bottom', 0);
            }
        }
        else {
            if ($(side_by_side).next().hasClass('side-by-side-wrapper')) {
                $(side_by_side).css('margin-bottom', 30);
            }
        }
    });
};

var on_begin_click = function() {
    /*
    * Handles clicks on the begin button.
    */

    // If this is a mobile device, start up the waterworks.
    if (Modernizr.touch) {
        $( "#content" ).addClass( "touch-begin" );
    }

    // Smooth scroll us to the intro.
    $.smoothScroll({ speed: 800, scrollTarget: '#intro' });

    // Don't do anything else.
    return false;
};

var button_toggle_caption_click = function() {
    /*
    * Click handler for the caption toggle.
    */

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'captions', 'Clicked caption button']);
    $( this ).parent( ".captioned" ).toggleClass('cap-on');
};

var on_nav_click = function(){
    /*
    * Click handler for navigation element clicks.
    */
    var hash = $(this).attr('href').replace('#', '');
    $.smoothScroll({ speed: 800, scrollTarget: '#' + hash });
    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'navigation', 'clicked chapter nav link']);

    return false;
};

var on_lightbox_click = function() {
    /*
    * Click handler for lightboxed photos.
    */
    if (!Modernizr.touch) {
        lightbox_image($(this).find('img'));
    }
};

var on_intro_advance_click = function() {
    /*
    * Click handler on intro advance.
    */
    $.smoothScroll({ speed: 800, scrollTarget: '#bananas' });
};

var on_waypoint = function(element, direction) {
    /*
    * Event for reaching a waypoint.
    */

    $('ul.nav li').removeClass('active');

    if (direction == "down") {
        var active = $(element).attr('id');
    }
    else if (direction == "up") {
        var prev = $(element).parent().prevAll('h1:first');
        var active = prev.find('a').attr('id');
    }

    if (active) {
        $('.' + active + '-nav').addClass('active');
    }
};

var lightbox_image = function(element) {
    /*
    * We built our own lightbox function.
    * We wanted more control over transitions and didn't
    * require image substitution.
    * You'll note that there are three functions.
    * This is because we need to fade the lightbox in and out,
    * but removing/adding it to the document is instantaneous with CSS.
    */

    // Add lightbox to the document.
    $('body').append('<div id="lightbox"><i class="fa fa-plus-circle close-lightbox"></i></div>');

    // Get our elements.
    $lightbox = $('#lightbox');
    var $el = $(element);

    // Get the clicked image and add it to lightbox.
    $lightbox.append('<img src="' + $el.attr('src') + '" id="lightbox_image">');
    $lightbox_image = $('#lightbox_image');

    // Base styles for the lightbox.
    $lightbox.css({
        display: 'block',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        'z-index': 500,
    });

    // Transition with debounce.
    fade = _.debounce(fade_lightbox_in, 1);
    fade();

    // Grab Wes's properly sized width.
    var lightbox_width = w;

    // Sometimes, this is wider than the window, which is bad.
    if (lightbox_width > $w.width()) {
        lightbox_width = $w.width();
    }

    // Set the hight as a proportion of the image width.
    var lightbox_height = ((lightbox_width * aspect_height) / aspect_width);

    // Sometimes the lightbox width is greater than the window height.
    // Center it vertically.
    if (lightbox_width > $w.height()) {
        lightbox_top = (lightbox_height - $w.height()) / 2;
    }

    // Sometimes the lightbox height is greater than the window height.
    // Resize the image to fit.
    if (lightbox_height > $w.height()) {
        lightbox_width = ($w.height() * aspect_width) / aspect_height;
        lightbox_height = $w.height();
    }

    // Sometimes the lightbox width is greater than the window width.
    // Resize the image to fit.
    if (lightbox_width > $w.width()) {
        lightbox_height = ($w.width() * aspect_height) / aspect_width;
        lightbox_width = $w.width();
    }

    // Set the top and left offsets.
    var lightbox_top = ($w.height() - lightbox_height) / 2;
    var lightbox_left = ($w.width() - lightbox_width) / 2;

    // Set styles on the lightbox image.
    $lightbox_image.css({
        'width': lightbox_width + 'px',
        'height': lightbox_height + 'px',
        'opacity': 1,
        'position': 'absolute',
        'top': lightbox_top + 'px',
        'left': lightbox_left + 'px',
    });

    // Disable scrolling while the lightbox is present.
    $('body').css({
        overflow: 'hidden'
    });

    // On click, remove the lightbox.
    $lightbox.on('click', on_remove_lightbox);
};

var on_remove_lightbox = function() {
    /*
    * Handles the click event.
    */

    // Set the element.
    $el = $('#lightbox');

    // Fade to black.
    $el.css({
        opacity: 0,
    });

    // Un-disable scrolling.
    $('body').css({
        overflow: 'auto'
    });

    // Debounce the fade.
    fade = _.debounce(fade_lightbox_out, 250);
    fade();
};

var fade_lightbox_in = function() {
    /*
    * Fade in event.
    */
    $lightbox.css({
        opacity: 1
    });
};

var fade_lightbox_out = function() {
    /*
    * Fade out event.
    */
    $lightbox.remove();
};

var onClippyCopy = function(e) {
    alert('Copied to your clipboard!');

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'summary-copied']);
}

/*
 * Track scroll depth for completion events.
 *
 * After: https://github.com/robflaherty/jquery-scrolldepth
 */
var onScroll = _.throttle(function(e) {
    var docHeight = $(document).height();
    var winHeight = window.innerHeight ? window.innerHeight : $window.height();
    var scrollDistance = $(document).scrollTop() + winHeight;

    var marks = {
        '25%' : parseInt(docHeight * 0.25),
        '50%' : parseInt(docHeight * 0.50),
        '75%' : parseInt(docHeight * 0.75),
        '100%': docHeight - 5
    };

    $.each(marks, function(mark, px) {
        if (trackedMarks.indexOf(mark) == -1 && scrollDistance >= px) {
            _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'completion', mark]);
            trackedMarks.push(mark);
        }
    });
}, 500);

/*
 * Share modal opened.
 */
var onShareModalShown = function(e) {
    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'open-share-discuss']);

    if (firstShare) {
        loadComments();

        firstShare = false;
    }
}

/*
 * Share modal closed.
 */
var onShareModalHidden = function(e) {
    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'close-share-discuss']);
}

$(document).ready(function() {
    $container = $('#content');
    $titlecard = $('.titlecard');
    $titlecard_wrapper = $('.titlecard-wrapper');
    $waypoints = $('#content h1 a');
    $nav = $('.nav a');
    $begin = $('.begin-bar');
    $button_toggle_caption = $('.caption-label');
    $overlay = $('#fluidbox-overlay');
    $enlarge = $('.enlarge');
    $intro_advance = $("#intro-advance");
    $side_by_sides = $('.side-by-side-wrapper');
    $shareModal = $('#share-modal');

    $button_toggle_caption.on('click', button_toggle_caption_click);
    $begin.on('click', on_begin_click);
    $nav.on('click', on_nav_click);
    $enlarge.on('click', on_lightbox_click);
    $w.on('resize', on_window_resize);
    $intro_advance.on('click', on_intro_advance_click);
    $shareModal.on('shown.bs.modal', onShareModalShown);
    $shareModal.on('hidden.bs.modal', onShareModalHidden);
    $(document).on('scroll', onScroll);

    on_window_resize();
    sub_responsive_images();
    fix_image_grid_spacing();


    ZeroClipboard.config({ swfPath: 'js/lib/ZeroClipboard.swf' });
    var clippy = new ZeroClipboard($(".clippy"));
    clippy.on('ready', function(readyEvent) {
        clippy.on('aftercopy', onClippyCopy);
    });

    $waypoints.waypoint(function(direction){
        on_waypoint(this, direction);
    });
});

// Defer pointer events on animated header
$w.load(function (){
  $('header').css({
    'pointer-events': 'auto'
  });
});
