const { createClient } = window.supabase;
const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
const supabase = createClient(supabaseURL, supabaseKey);

async function addItemToLibrary(event) {
    event.preventDefault(); // Prevent default form submission

    const bookName = document.getElementById("newbookname").value.trim();
    const errorMsg = document.getElementById("error-msg");

    if (!bookName) {
        errorMsg.textContent = "Please enter a book name.";
        return;
    }

    errorMsg.textContent = "";

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            throw new Error("User not logged in.");
        }
        const userId = user.id;

        const { data, error } = await supabase
            .from("table2")
            .select("id, Library_Stock, In_Stock")
            .eq("id", userId)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                const { error: insertError } = await supabase
                    .from("table2")
                    .insert({
                        id: userId,
                        Library_Stock: [bookName],
                        In_Stock: [bookName]
                    })
                    .select()
                    .single();

                if (insertError) {
                    throw new Error("Insert failed: " + insertError.message);
                }
                errorMsg.textContent = "Book added to new row!";
            } else {
                throw new Error("Fetch error: " + error.message);
            }
        } else if (data) {
            const updatedLibraryStock = Array.isArray(data.Library_Stock)
                ? [...data.Library_Stock, bookName]
                : [bookName];
            const updatedInStock = Array.isArray(data.In_Stock)
                ? [...data.In_Stock, bookName]
                : [bookName];

            const { error: updateError } = await supabase
                .from("table2")
                .update({
                    Library_Stock: updatedLibraryStock,
                    In_Stock: updatedInStock
                })
                .eq("id", data.id)
                .select()
                .single();

            if (updateError) {
                throw new Error("Update failed: " + updateError.message);
            }
            errorMsg.textContent = "Successfully added a new book!";
        }
    } catch (err) {
        console.error("Error:", err);
        errorMsg.textContent = "Something went wrong: " + err.message;
    }

    document.getElementById("newbookname").value = "";
}

// Add event listener to the form instead of the button
document.getElementById("addItemForm").addEventListener("submit", addItemToLibrary);
