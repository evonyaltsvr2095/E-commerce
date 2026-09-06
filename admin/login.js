const ADMIN_EMAIL_DOMAIN = "@admin.kopingalam.local";

const form = document.querySelector("#adminLoginForm");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const loginButton = document.querySelector("#loginButton");
const loginText = document.querySelector("#loginText");
const loginLoading = document.querySelector("#loginLoading");
const togglePassword = document.querySelector("#togglePassword");

feather.replace();

function normalizeUsername(value) {
  return value.trim().toLowerCase();
}

function usernameToAuthEmail(value) {
  const username = normalizeUsername(value);
  // Jika pengguna memasukkan email lengkap, pakai langsung.
  // Jika hanya memasukkan username, gunakan domain admin lama.
  return username.includes("@") ? username : `${username}${ADMIN_EMAIL_DOMAIN}`;
}

async function redirectIfAlreadyLoggedIn() {
  const { data } = await supabaseClient.auth.getSession();
  if (data?.session) {
    window.location.replace("dashboard.html");
  }
}

togglePassword?.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.innerHTML = `<i data-feather="${isPassword ? "eye-off" : "eye"}"></i>`;
  feather.replace();
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = normalizeUsername(usernameInput.value);
  const password = passwordInput.value;

  if (username.length < 3) {
    Swal.fire({
      icon: "warning",
      title: "Username/email tidak valid",
      text: "Masukkan username atau email yang valid.",
    });
    return;
  }

  if (password.length < 6) {
    Swal.fire({
      icon: "warning",
      title: "Password tidak valid",
      text: "Password minimal 6 karakter.",
    });
    return;
  }

  loginButton.disabled = true;
  loginText.hidden = true;
  loginLoading.hidden = false;

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: usernameToAuthEmail(username),
      password,
    });

    if (error) throw error;
    if (!data.session) throw new Error("Session admin tidak terbentuk.");

    window.location.replace("dashboard.html");
  } catch (error) {
    console.error("Admin login error:", error);
    await Swal.fire({
      icon: "error",
      title: "Login gagal",
      text: "Email/username atau password salah, atau akun admin belum terdaftar di Supabase baru.",
      confirmButtonColor: "#b6895b",
    });
  } finally {
    loginButton.disabled = false;
    loginText.hidden = false;
    loginLoading.hidden = true;
  }
});

redirectIfAlreadyLoggedIn();
