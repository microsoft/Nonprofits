console.info("Profile.JS code")
if (window.jQuery) {
    $(document).ready(function () {

        $("#ContentContainer_MainContent_MainContent_ContentBottom_SubmitButton").removeClass ("btn-primary").addClass ("btn-danger");
        $("h2").remove();
        var fullname = $('div.well').text().replaceAll("\t", "").replaceAll("\n", "").trim();
        $("#mainTitle").text(fullname);
        document.title = "Profile: " + fullname;
    })
}