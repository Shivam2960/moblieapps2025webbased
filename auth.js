document.addEventListener("DOMContentLoaded", () => {
    const { createClient } = window.supabase;
    const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
    const supabase = createClient(supabaseURL, supabaseAnonKey);

    document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const firstname = document.getElementById("first-name").value;
        const lastname = document.getElementById("last-name").value;
        const city = document.getElementById("city").value;
        const accountType = localStorage.getItem("accountType");
        const libraryName = document.getElementById("library-name")?.value || "NOT LIBRARY ACCOUNT";
        const errorMsg = document.getElementById("error-msg");

        try {
            // Sign up user
            const { data: { user }, error: signupError } = await supabase.auth.signUp({
                email,
                password
            });

            if (signupError) throw signupError;

            // Insert user data
            const { error: insertError } = await supabase.from('table2').insert([{
                firstname,
                lastname,
                city,
                email,
                accountType,
                libraryName,
                id: user.id
            }]);

            if (insertError) throw insertError;

            // Redirect to login after successful signup
            window.location.href = "loginPage.html";
        } catch (error) {
            errorMsg.textContent = error.message;
        }
    });
});