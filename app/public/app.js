// SnapNest front-end
// ------------------------------------------------------------------
// DEV NOTE (remove before production):
//   - API health/status: GET /api/status  (returns JSON, no auth)
//   - internal build panel at /__debug while we're on staging
// TODO: delete /__debug and protect /api/status before launch
// ------------------------------------------------------------------

// simple upload-form validation: only allow images to be submitted
document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("uploadForm");
  var input = document.getElementById("photo");
  if (!form || !input) return;

  form.addEventListener("submit", function (e) {
    var f = input.files[0];
    if (f && !f.type.startsWith("image/")) {
      e.preventDefault();
      alert("Only images are allowed!");
    }
  });
});
