const { createClient } = window.supabase;
const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
let supabase = createClient(supabaseURL, supabaseAnonKey);

// Function to fetch session and user profile
async function getSession() {
    const { data: session, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error fetching session:', error);
        return null;
    }
    return session;
}

async function getUserProfile(userId) {
    const { data: userProfile, error } = await supabase
        .from('table2')
        .select()
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
    return userProfile;
}

// Fetch user profile to dynamically update "Hi Library"
async function updateLibraryTitle() {
    const sessionData = await getSession();
    if (!sessionData || !sessionData.session) {
        console.error('No active session found.');
        return;
    }

    const userId = sessionData.session.user.id;
    const userProfile = await getUserProfile(userId);

    if (userProfile) {
        const libraryTitle = document.getElementById('library-title');
        libraryTitle.textContent = `Hi ${userProfile.firstname}!`;
    }
}

// Call function to update the library title dynamically
updateLibraryTitle();

// Fetch and display library stock data
const allItemsElement = document.getElementById("all-items");
const inStockElement = document.getElementById("in-stock");
const borrowedItemsElement = document.getElementById("borrowed-items");
const overdueItemsContainer = document.querySelector("p:nth-of-type(4)");

async function fetchLibraryStock() {
    try {
        const sessionData = await getSession();
        if (!sessionData || !sessionData.session) {
            console.error('No active session found.');
            return;
        }
        const userId = sessionData.session.user.id;

        const { data, error } = await supabase
            .from("table2")
            .select("Library_Stock, In_Stock, borrowed_info")
            .eq('id', userId)
            .single();

        if (error) throw error;

        console.log("Fetched Data:", data); // Debug output

        const libraryStock = Array.isArray(data.Library_Stock) ? data.Library_Stock : [];
        const inStockItems = Array.isArray(data.In_Stock) ? data.In_Stock : [];
        const borrowedItems = Array.isArray(data.borrowed_info) ? data.borrowed_info : [];

        allItemsElement.textContent = libraryStock.join(", ") || "None";
        inStockElement.textContent = inStockItems.join(", ") || "None";
        borrowedItemsElement.textContent = borrowedItems.join(", ") || "None";

        const overdueItems = getOverdueItems(borrowedItems);
        console.log("Overdue Items:", overdueItems); // Debug output
        overdueItemsContainer.innerHTML = `<strong>Overdue items: </strong> ${overdueItems.length > 0 ? overdueItems.join(", ") : "None"}`;
    } catch (err) {
        console.error("Error fetching library stock:", err.message);
    }
}

function getOverdueItems(borrowedItems) {
    const today = new Date();
    let overdueItems = [];

    borrowedItems.forEach(item => {
        // Expected format: "ItemName By: PersonName Due: MM-DD-YYYY PN: PhoneNumber"
        const regex = /^(.*?)\sBy:\s(.*?)\sDue:\s(\d{2})-(\d{2})-(\d{4})/;
        const match = item.match(regex);
        if (match) {
            const itemName = match[1];    // Item title
            const borrower = match[2];    // Borrower's name
            const month = match[3], day = match[4], year = match[5];
            const dueDate = new Date(`${year}-${month}-${day}`); // Convert to Date object

            if (dueDate < today) {
                overdueItems.push(item); // Keep the original format for display
                sendOverdueNotification(itemName, borrower, `${month}-${day}-${year}`);
            }
        } else {
            console.log("No match for item:", item); // Debug unmatched items
        }
    });

    return overdueItems;
}

function sendOverdueNotification(itemName, borrower, dueDate) {
    if (Notification.permission === "granted") {
        new Notification("Overdue Library Item", {
            body: `${itemName} is overdue!\nBorrower: ${borrower}\nDue Date: ${dueDate}`,
            icon: "https://example.com/overdue-icon.png" // Replace with your own icon URL
        });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                sendOverdueNotification(itemName, borrower, dueDate);
            }
        });
    }
}

// Call function to fetch and display library stock
fetchLibraryStock();