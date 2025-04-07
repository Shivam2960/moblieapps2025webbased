document.addEventListener("DOMContentLoaded", () => {
    // Initialize Supabase
    const { createClient } = window.supabase;
    const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
    const supabaseAnonKey =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
    const supabase = createClient(supabaseURL, supabaseAnonKey);

    // Login
    const loginBtn = document.getElementById("loginBtn");
    loginBtn?.addEventListener("click", async () => {
        const email = document.getElementById("email")?.value || "";
        const password = document.getElementById("password")?.value || "";

        const { error, session, user } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            document.getElementById("error-msg").textContent = error.message;
        } else {
            // Fetch the user's account type from the table
            const { data: userAccount, error: fetchError } = await supabase
                .from("table2")
                .select("accountType")
                .eq("email", email)
                .single();

            if (fetchError) {
                document.getElementById("error-msg").textContent =
                    "Unable to fetch account type.";
            } else {
                // Redirect based on account type
                if (userAccount.accountType === "Borrower Account") {
                    window.location.href = "display_borrwer.html";
                } else if (userAccount.accountType === "Library Account") {
                    window.location.href = "display_library.html";
                } else {
                    document.getElementById("error-msg").textContent =
                        "Unknown account type.";
                }
            }
        }
    });

    // Signup logic remains the same
    const signUpBtn = document.getElementById("signup-btn");
    signUpBtn?.addEventListener("click", async () => {
        const email = document.getElementById("email")?.value || "";
        const password = document.getElementById("password")?.value || "";
        const firstname = document.getElementById("first-name")?.value || "";
        const lastname = document.getElementById("last-name")?.value || "";
        const city = document.getElementById("city")?.value || "";
        const libraryNameInput = document.getElementById("library-name");
        const accountType = localStorage.getItem("accountType");

        // Set libraryName based on accountType
        const libraryName =
            accountType === "Library Account" && libraryNameInput
                ? libraryNameInput.value
                : "NOT LIBRARY ACCOUNT";

        // Sign up the user
        const { data: { user }, error: signupError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signupError) {
            document.getElementById("error-msg").textContent = signupError.message;
        } else {
            // Insert into table2 with user_id
            const { error: insertError } = await supabase.from("table2").insert([
                {
                    firstname,
                    lastname,
                    city,
                    email,
                    accountType,
                    libraryName,
                    id: user.id, // Now correctly accessed
                },
            ]);

            if (insertError) {
                document.getElementById("error-msg").textContent =
                    insertError.message;
            } else {
                window.location.href = "loginPage.html";
            }
        }
    });
});
