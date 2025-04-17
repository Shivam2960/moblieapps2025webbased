const { createClient } = window.supabase;
const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
const supabase = createClient(supabaseURL, supabaseAnonKey);

// Function to populate dropdown with In_Stock items
async function populateCheckoutDropdown() {
    const select = document.getElementById("checkoutitemname");
    select.innerHTML = ""; // Clear existing options

    try {
        // Get user session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) throw new Error("No active session found.");
        const userId = sessionData.session.user.id;

        // Fetch In_Stock from Supabase
        const { data, error } = await supabase
            .from("table2")
            .select("In_Stock")
            .eq("id", userId)
            .single();

        if (error) throw error;

        const inStockItems = data.In_Stock || [];

        // Handle empty stock
        if (inStockItems.length === 0) {
            const option = document.createElement("option");
            option.textContent = "No items available";
            option.disabled = true;
            select.appendChild(option);
            return;
        }

        // Populate dropdown with all in-stock items
        inStockItems.forEach(item => {
            const option = document.createElement("option");
            option.value = item;
            option.textContent = item;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Error populating dropdown:", err);
        document.getElementById("error-msg").textContent = `Error loading items: ${err.message}`;
    }
}

// Existing formatDate function remains the same
function formatDateToMMDDYYYY(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${month}-${day}-${year}`;
}

// Modified checkOutItem function with dropdown refresh
async function checkOutItem() {
    const itemName = document.getElementById("checkoutitemname").value.trim();
    const dueDate = document.getElementById("dueDate").value.trim();
    const personName = document.getElementById("checkoutpersonname").value.trim();
    const phoneNumber = document.getElementById("checkoutpersonPN").value.trim();
    const errorMsg = document.getElementById("error-msg");

    if (!itemName || !dueDate || !personName || !phoneNumber) {
        errorMsg.textContent = "Please fill out all fields.";
        return;
    }

    errorMsg.textContent = "";

    try {
        // Existing checkout logic remains the same
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) throw new Error("No active session found.");
        const userId = sessionData.session.user.id;

        const { data, error } = await supabase
            .from("table2")
            .select("id, In_Stock, borrowed_info")
            .eq("id", userId)
            .single();

        if (error) throw error;

        const libraryId = data.id;
        let currentInStockItems = data.In_Stock || [];
        let currentBorrowedItems = data.borrowed_info || [];

        // Validation check remains
        if (!currentInStockItems.includes(itemName)) {
            errorMsg.textContent = "Error: Item is no longer available.";
            return;
        }

        // Update arrays
        currentInStockItems = currentInStockItems.filter(item => item !== itemName);
        const formattedDueDate = formatDateToMMDDYYYY(dueDate);
        const checkoutDetails = `${itemName} By: ${personName} Due: ${formattedDueDate} PN: ${phoneNumber}`;
        currentBorrowedItems.push(checkoutDetails);

        // Update Supabase
        const { error: updateError } = await supabase
            .from("table2")
            .update({
                In_Stock: currentInStockItems,
                borrowed_info: currentBorrowedItems
            })
            .eq("id", libraryId);

        if (updateError) throw updateError;

        // Clear inputs and refresh dropdown
        document.getElementById("dueDate").value = "";
        document.getElementById("checkoutpersonname").value = "";
        document.getElementById("checkoutpersonPN").value = "";
        errorMsg.textContent = "Item checked out successfully!";
        await populateCheckoutDropdown(); // Refresh the dropdown
    } catch (err) {
        console.error("Error:", err);
        errorMsg.textContent = `Error: ${err.message}`;
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("checkitemout").addEventListener("click", checkOutItem);
    populateCheckoutDropdown(); // Populate on initial load
});