const { createClient } = window.supabase;
const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
const supabase = createClient(supabaseURL, supabaseAnonKey);

// Function to format date from YYYY-MM-DD to MM-DD-YYYY
function formatDateToMMDDYYYY(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${month}-${day}-${year}`;
}

// Function to check out an item
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

    errorMsg.textContent = ""; // Clear previous error message

    try {
        // Get the current user's session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) throw new Error("No active session found.");
        const userId = sessionData.session.user.id;

        // Fetch current data for the user
        const { data, error } = await supabase
            .from("table2")
            .select("id, Library_Stock, borrowed_info, In_Stock")
            .eq("id", userId)
            .single();

        if (error) throw error;

        const libraryId = data.id;
        const currentLibraryStock = data.Library_Stock || [];
        let currentBorrowedItems = data.borrowed_info || [];
        let currentInStockItems = data.In_Stock || [];

        // Log data for debugging
        console.log("Library_Stock:", currentLibraryStock);
        console.log("In_Stock:", currentInStockItems);
        console.log("borrowed_info:", currentBorrowedItems);

        // Check if item is in In_Stock
        if (!currentInStockItems.includes(itemName)) {
            errorMsg.textContent = "Error: Item is not available in stock.";
            return;
        }

        // Remove item from In_Stock
        currentInStockItems = currentInStockItems.filter(item => item !== itemName);

        // Format the due date to MM-DD-YYYY
        const formattedDueDate = formatDateToMMDDYYYY(dueDate);

        // Format checkout details with the reformatted date
        const checkoutDetails = `${itemName} By: ${personName} Due: ${formattedDueDate} PN: ${phoneNumber}`;

        // Append to borrowed_info
        currentBorrowedItems.push(checkoutDetails);

        // Update Supabase
        const { data: updateData, error: updateError } = await supabase
            .from("table2")
            .update({
                In_Stock: currentInStockItems,
                borrowed_info: currentBorrowedItems
            })
            .eq("id", libraryId);

        if (updateError) throw updateError;

        // Clear input fields
        document.getElementById("checkoutitemname").value = "";
        document.getElementById("dueDate").value = "";
        document.getElementById("checkoutpersonname").value = "";
        document.getElementById("checkoutpersonPN").value = "";

        errorMsg.textContent = "Item checked out successfully!";
    } catch (err) {
        console.error("Full error:", err);
        errorMsg.textContent = `Error: ${err.message}`;
    }
}

// Attach event listener to button
document.getElementById("checkitemout").addEventListener("click", checkOutItem);