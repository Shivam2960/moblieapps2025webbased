const { createClient } = window.supabase;
const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
const supabase = createClient(supabaseURL, supabaseKey);

async function addItemToLibrary(event) {
    event.preventDefault();

    const bookName = document.getElementById("newbookname").value.trim();
    const errorMsg = document.getElementById("error-msg");
    errorMsg.style.color = "#d32f2f"; // Red color for errors

    if (!bookName) {
        errorMsg.textContent = "Please enter a book name.";
        return;
    }

    errorMsg.textContent = "";

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            throw new Error("Please log in to add items to your library.");
        }
        const userId = user.id;

        const { data, error } = await supabase
            .from("table2")
            .select("id, Library_Stock, In_Stock, borrowed_info")
            .eq("id", userId)
            .single();

        if (error && error.code !== "PGRST116") {
            throw new Error("Couldn't access your library. Please try again.");
        }

        // Check for duplicates if data exists
        if (data) {
            let duplicateMessage = "";

            // Check in Library_Stock
            if (Array.isArray(data.Library_Stock) && data.Library_Stock.some(item => item === bookName)) {
                duplicateMessage = `"${bookName}" is already in your library collection.`;
            }

            // Check in In_Stock
            else if (Array.isArray(data.In_Stock) && data.In_Stock.some(item => item === bookName)) {
                duplicateMessage = `"${bookName}" is currently available in your inventory.`;
            }

            // Check in borrowed_info
            else if (Array.isArray(data.borrowed_info) && data.borrowed_info.some(item => {
                const bookNameInBorrowed = item.split(' By: ')[0];
                return bookNameInBorrowed === bookName;
            })) {
                duplicateMessage = `"${bookName}" is currently checked out by someone.`;
            }

            if (duplicateMessage) {
                errorMsg.innerHTML = `
                    ${duplicateMessage}<br>
                    Please enter a different book or check your inventory.
                `;
                return;
            }
        }

        // If no duplicates found, proceed with adding the book
        if (!data || error?.code === "PGRST116") {
            const { error: insertError } = await supabase
                .from("table2")
                .insert({
                    id: userId,
                    Library_Stock: [bookName],
                    In_Stock: [bookName]
                });

            if (insertError) {
                throw new Error("We couldn't add your book. Please try again.");
            }
            errorMsg.style.color = "#2e7d32"; // Green for success
            errorMsg.innerHTML = `
                 "${bookName}" has been added to your library!
            `;
        } else {
            const updatedLibraryStock = Array.isArray(data.Library_Stock) ? [...data.Library_Stock, bookName] : [bookName];
            const updatedInStock = Array.isArray(data.In_Stock) ? [...data.In_Stock, bookName] : [bookName];

            const { error: updateError } = await supabase
                .from("table2")
                .update({
                    Library_Stock: updatedLibraryStock,
                    In_Stock: updatedInStock
                })
                .eq("id", data.id);

            if (updateError) {
                throw new Error("We couldn't update your library. Please try again.");
            }
            errorMsg.style.color = "#2e7d32"; // Green for success
            errorMsg.innerHTML = `
                "${bookName}" has been successfully added to your collection!
            `;
        }
    } catch (err) {
        console.error("Error:", err);
        errorMsg.innerHTML = `
           ${err.message}
        `;
    }

    document.getElementById("newbookname").value = "";
}

document.getElementById("addItemForm").addEventListener("submit", addItemToLibrary);