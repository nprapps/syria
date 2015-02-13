// Global state
var $upNext = null;
var $w;
var $h;
var $slides;
var $start;
var $nextChapter;
var $previousChapter;
var $startCardButton;
var $startAnchor;
var $shareModal;
var isTouch = Modernizr.touch;
var aspectWidth = 16;
var aspectHeight = 9;
var optimalWidth;
var optimalHeight;
var w;
var h;
var completion = 0;
var lastSlideExitEvent;
var firstShareLoad = true;

var resize = function() {
    $w = $(window).width();
    $h = $(window).height();

    $slides.width($w);

    optimalWidth = ($h * aspectWidth) / aspectHeight;
    optimalHeight = ($w * aspectHeight) / aspectWidth;

    w = $w;
    h = optimalHeight;

    if (optimalWidth > $w) {
        w = optimalWidth;
        h = $h;
    }

    resizeTitleCard();
};

var resizeTitleCard = function() {
    $start.height($h);
    var image_path = 'assets/img/' + $start.data('bgimage');
    $start.css('background-image', 'url(' + image_path + ')');
}

var setUpFullPage = function() {
    var anchors = ['_'];
    for (var i = 0; i < COPY.chapters.length; i++) {
        anchors.push(COPY.chapters[i].id);
    }
    $.fn.fullpage({
        anchors: anchors,
        autoScrolling: false,
        keyboardScrolling: false,
        verticalCentered: false,
        fixedElements: '.primary-navigation, #share-modal',
        resize: false,
        css3: true,
        loopHorizontal: false,
        afterRender: onPageLoad,
        afterSlideLoad: lazyLoad,
        onSlideLeave: onSlideLeave
    });
};

var onPageLoad = function() {
    setSlidesForLazyLoading(0);
    $('.section').css({
      'opacity': 1,
      'visibility': 'visible',
    });
};

// after a new slide loads
var lazyLoad = function(anchorLink, index, slideAnchor, slideIndex) {
    setSlidesForLazyLoading(slideIndex);

    // Completion tracking
    how_far = (slideIndex + 1) / ($slides.length - APP_CONFIG.NUM_SLIDES_AFTER_CONTENT);

    if (how_far >= completion + 0.25) {
        completion = how_far - (how_far % 0.25);

        if (completion === 0.25) {
            ANALYTICS.completeTwentyFivePercent();
        }
        else if (completion === 0.5) {
            ANALYTICS.completeFiftyPercent();
        }
        else if (completion === 0.75) {
            ANALYTICS.completeSeventyFivePercent();
        }
        else if (completion === 1) {
            ANALYTICS.completeOneHundredPercent();
        }
    }
};

var setSlidesForLazyLoading = function(slideIndex) {
    /*
    * Sets up a list of slides based on your position in the deck.
    * Lazy-loads images in future slides because of reasons.
    */
    var slides = [
        $slides.eq(slideIndex),
        $slides.eq(slideIndex + 1),
    ];

    for (var i = 0; i < slides.length; i++) {
        loadImages(slides[i]);
    };

}

var loadImages = function($slide) {
    /*
    * Lazy load images.
    */
    var prefix;
    var image_path;

    if ($w < 769) {
        prefix = 'mobile-';
    }

    if (!prefix) {
        prefix = 'desktop-';
    }
    var $images = $slide.find('img');
    for (var i = 0; i < $images.length; i++) {
        if ($images.eq(i).data('image')) {
            var image_path = 'assets/img/' + prefix + $images.eq(i).data('image');
            $images.eq(i).attr('src', image_path);
        }
    }
};

var onSlideLeave = function(anchorLink, index, slideIndex, direction) {
    // Called when leaving a slide.

    // Reset scroll
    $slides.eq(slideIndex).scrollTop(0);

    // Log time on slide
    ANALYTICS.exitSlide(slideIndex.toString(), lastSlideExitEvent);
}

var onStartCardButtonClick = function() {
    lastSlideExitEvent = 'go';
    $.smoothScroll({
        scrollElement: $slides.eq(0),
        scrollTarget: $startAnchor
    });
}

var onNextChapterClick = function() {
    lastSlideExitEvent = 'next-chapter';
    $.fn.fullpage.moveSlideRight();
}

var onPreviousChapterClick = function() {
    lastSlideExitEvent = 'previous-chapter';
    $.fn.fullpage.moveSlideLeft();
}

var onNextPostClick = function(e) {
    e.preventDefault();

    ANALYTICS.trackEvent('next-post');
    window.top.location = NEXT_POST_URL;
    return true;
}

/*
 * Share modal opened.
 */
var onShareModalShown = function(e) {
    ANALYTICS.openShareDiscuss();

    if (firstShareLoad) {
        loadComments();

        firstShareLoad = false;
    }
}

/*
 * Share modal closed.
 */
var onShareModalHidden = function(e) {
    ANALYTICS.closeShareDiscuss();
}

/*
 * Text copied to clipboard.
 */
var onClippyCopy = function(e) {
    alert('Copied to your clipboard!');

    ANALYTICS.copySummary();
}

var onDocumentKeyDown = function(e) {
    if (e.which === 37 || e.which === 39) {
        lastSlideExitEvent = 'keyboard';
        ANALYTICS.useKeyboardNavigation();
        if (e.which === 37) {
            $.fn.fullpage.moveSlideLeft();
        } else if (e.which === 39) {
            $.fn.fullpage.moveSlideRight();
        }
    }
    // jquery.fullpage handles actual scrolling
    return true;
}

$(document).ready(function() {
    $w = $(window).width();
    $h = $(window).height();

    $slides = $('.slide');
    $start = $('.start');
    $navButton = $('.primary-navigation-btn');
    $startCardButton = $('.btn-go');
    $startAnchor = $('#start-anchor');
    $nextChapter = $('.next-chapter');
    $previousChapter = $('.previous-chapter');
    $upNext = $('.up-next');
    $shareModal = $('#share-modal');

    // Bind events
    $shareModal.on('shown.bs.modal', onShareModalShown);
    $shareModal.on('hidden.bs.modal', onShareModalHidden);

    $startCardButton.on('click', onStartCardButtonClick);
    $upNext.on('click', onNextPostClick);
    $nextChapter.on('click', onNextChapterClick);
    $previousChapter.on('click', onPreviousChapterClick);

    ZeroClipboard.config({ swfPath: 'js/lib/ZeroClipboard.swf' });
    var clippy = new ZeroClipboard($(".clippy"));
    clippy.on('ready', function(readyEvent) {
        clippy.on('aftercopy', onClippyCopy);
    });

    setUpFullPage();
    resize();

    // Redraw slides if the window resizes
    window.addEventListener("deviceorientation", resize, true);
    $(window).resize(resize);

    $(document).keydown(onDocumentKeyDown);

    var pymParent = new pym.Parent(
        'responsive-embed-syria-refugees-by-country',
        'http://apps.npr.org/dailygraphics/graphics/syria-refugees-by-country/child.html',
        {}
    );

});
