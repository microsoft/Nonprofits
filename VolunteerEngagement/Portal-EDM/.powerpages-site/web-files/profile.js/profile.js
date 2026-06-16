// Sync dark mode from SPA (ve-theme localStorage key) to Liquid pages
(function() {
    try {
        if (localStorage.getItem('ve-theme') === 'dark') {
            document.documentElement.classList.add('ve-dark');
        }
    } catch(e) {}
})();

(function() {
    if (!/\/Account\/Login\/ForgotPassword/i.test(window.location.pathname)) {
        return;
    }

    var normalizeForgotPasswordHeading = function() {
        var heading = document.querySelector('h1, h2, #header-page-title');
        if (!heading || heading.textContent.trim() !== 'Forgot your password?') {
            return;
        }

        heading.removeAttribute('tabindex');
        if (document.activeElement === heading) {
            heading.blur();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', normalizeForgotPasswordHeading);
    } else {
        normalizeForgotPasswordHeading();
    }

    window.setTimeout(normalizeForgotPasswordHeading, 250);
})();

console.info("Profile.JS code")
if (window.jQuery) {
    $(document).ready(function () {

        var mainTitle = $("#mainTitle");
        if (!mainTitle.length) {
            return;
        }

        $("#ContentContainer_MainContent_MainContent_ContentBottom_SubmitButton").removeClass ("btn-primary").addClass ("btn-danger");
        $("h2").remove();
        var fullname = $('div.well').text().replaceAll("\t", "").replaceAll("\n", "").trim();
        mainTitle.text(fullname);
        document.title = "Profile: " + fullname;
    })
}