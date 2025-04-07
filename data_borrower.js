const { createClient } = window.supabase;
const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
let supabase = createClient(supabaseURL, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    }
});

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
        .from('table2') // Ensure this is your correct table name
        .select()
        .eq('id', userId)
        .single();
    if (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
    return userProfile;
}

function sendNotification(message) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Library Notice", { body: message });
    } else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification("Library Notice", { body: message });
            }
        });
    }
}

function updateBooksDisplay(borrowedBooks) {
    const booksElem = document.getElementById('borrowed-books');
    const nextDueElem = document.getElementById('next-due');
    const overdueElem = document.getElementById('overdue-items');

    booksElem.innerHTML = "<strong>Borrowed books: </strong>";
    nextDueElem.innerHTML = "<strong>Next date a book is due is: </strong>";
    overdueElem.innerHTML = "<strong>Overdue items: </strong>";

    if (!borrowedBooks || borrowedBooks.length === 0) {
        booksElem.innerHTML += "None";
        nextDueElem.innerHTML += "None";
        overdueElem.innerHTML += "None";
        return;
    }

    booksElem.innerHTML += borrowedBooks.join(', ');

    const now = new Date();
    let nextDueBook = null;
    let overdueBooks = [];

    borrowedBooks.forEach(book => {
        const parts = book.split(" Due: ");
        if (parts.length === 2) {
            const dueStr = parts[1].trim();
            const dateParts = dueStr.split("/");
            if (dateParts.length === 3) {
                const month = parseInt(dateParts[0], 10);
                const day = parseInt(dateParts[1], 10);
                const year = parseInt(dateParts[2], 10);
                const dueDate = new Date(year, month - 1, day);

                if (dueDate >= now) {
                    if (nextDueBook === null || dueDate < new Date(nextDueBook.split(" Due: ")[1].split("/").reverse().join("-"))) {
                        nextDueBook = book;
                    }
                }

                if (dueDate < now) {
                    overdueBooks.push(book);
                }
            }
        }
    });

    if (nextDueBook) {
        const [title, dueDate] = nextDueBook.split(" Due: ");
        nextDueElem.innerHTML += `${title} on ${dueDate}`;
    } else {
        nextDueElem.innerHTML += "None";
    }

    if (overdueBooks.length > 0) {
        overdueElem.innerHTML += overdueBooks.join(', ');
        overdueBooks.forEach(book => {
            sendNotification(`Overdue: ${book}`);
        });
    } else {
        overdueElem.innerHTML += "None";
    }
}

async function fetchProfile() {
    const sessionData = await getSession();
    if (!sessionData || !sessionData.session) {
        console.error('No active session found.');
        return;
    }

    const userId = sessionData.session.user.id;
    console.log('Logged-in User ID:', userId);

    const userProfile = await getUserProfile(userId);

    if (userProfile) {
        console.log('User profile:', userProfile);
        const borrowerTitle = document.getElementById('borrower-title');
        if (borrowerTitle && userProfile.firstname) {
            borrowerTitle.textContent = `Hi ${userProfile.firstname}!`;
        }
        updateBooksDisplay(userProfile.Borrowed_Books_Borrower);
    }
}

fetchProfile().catch((error) => {
    console.error('Error:', error);
});