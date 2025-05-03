const { createClient } = window.supabase;
const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
const supabase = createClient(supabaseURL, supabaseAnonKey);

// Modified populateReturnDropdown function
async function populateReturnDropdown() {
    const select = document.getElementById("itemNameReturn");
    select.innerHTML = '<option value="">Select a borrowed item to return</option>'; // Reset with default

    try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) throw new Error("No active session found.");
        const userId = sessionData.session.user.id;

        const { data, error } = await supabase
            .from("table2")
            .select("borrowed_info")
            .eq("id", userId)
            .single();

        if (error) throw error;

        const borrowedItems = data.borrowed_info || [];

        // Only populate if there are items
        if (borrowedItems.length > 0) {
            borrowedItems.forEach(entry => {
                const option = document.createElement("option");
                option.value = entry;
                option.textContent = entry;
                select.appendChild(option);
            });
        }
    } catch (err) {
        console.error("Error populating dropdown:", err);
        errorMsg.style.color = "#d32f2f";
        document.getElementById("error-msg").textContent = `Error loading borrowed items: ${err.message}`;
    }
}

// Existing returnItem function remains unchanged

// Modified return function
async function returnItem() {
    const selectedEntry = document.getElementById("itemNameReturn").value;
    const errorMsg = document.getElementById("error-msg");

    if (!selectedEntry) {
        errorMsg.style.color = "#d32f2f";
        errorMsg.textContent = "Please select an item to return.";
        return;
    }

    errorMsg.textContent = "";

    try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) throw new Error("No active session found.");
        const userId = sessionData.session.user.id;

        const { data, error } = await supabase
            .from("table2")
            .select("id, borrowed_info, In_Stock")
            .eq("id", userId)
            .single();

        if (error) throw error;

        const libraryId = data.id;
        let currentBorrowedItems = data.borrowed_info || [];
        let currentInStockItems = data.In_Stock || [];

        // Find the exact borrowed entry
        const borrowedEntry = currentBorrowedItems.find(entry => entry === selectedEntry);

        if (!borrowedEntry) {
            errorMsg.textContent = "Error: Selected item is no longer borrowed.";
            await populateReturnDropdown();
            return;
        }

        // Extract item name from the stored entry
        const itemName = borrowedEntry.split(" By:")[0].trim();

        // Update arrays
        currentBorrowedItems = currentBorrowedItems.filter(entry => entry !== selectedEntry);
        currentInStockItems.push(itemName);

        // Update Supabase
        const { error: updateError } = await supabase
            .from("table2")
            .update({
                In_Stock: currentInStockItems,
                borrowed_info: currentBorrowedItems
            })
            .eq("id", libraryId);

        if (updateError) throw updateError;

        // Clear selection and refresh dropdown
        errorMsg.style.color = "#2e7d32";
        errorMsg.textContent = `"${itemName}" has been successfully returned!`;
        await populateReturnDropdown();
    } catch (err) {
        console.error("Full error:", err);
        errorMsg.textContent = `Error: ${err.message}`;
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    const returnButton = document.getElementById("returnBtn");
    if (returnButton) {
        returnButton.addEventListener("click", returnItem);
        populateReturnDropdown(); // Initial population
    } else {
        console.error("Return button not found");
    }
});