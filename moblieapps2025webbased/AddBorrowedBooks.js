const { createClient } = window.supabase;
const supabaseURL = "https://jidvjencxztuercjskgw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZHZqZW5jeHp0dWVyY2pza2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzEzNTEsImV4cCI6MjAzOTY0NzM1MX0.bmWEAB5ITALaAvfQ0_0ohephLy6_O5YbLpLuTRHaeRU";
let supabase = createClient(supabaseURL, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    }
});

document.getElementById('change').addEventListener('click', async () => {
    // Get and trim input values
    const title = document.getElementById('bookTitles').value.trim();
    const dueDateInput = document.getElementById('dueDates').value.trim();

    // Validate inputs
    if (!title || !dueDateInput) {
        document.getElementById('error-msg').textContent = 'Please enter both title and due date';
        return;
    }

    // Convert the due date to MM/DD/YYYY format
    let dueDate;
    if (dueDateInput.includes('/')) {
        // Assume input is already in MM/DD/YYYY format
        dueDate = dueDateInput;
    } else {
        // Assume input is in YYYY-MM-DD format (e.g., from <input type="date">)
        const [year, month, day] = dueDateInput.split('-');
        // Ensure month and day are zero-padded
        const formattedMonth = month.padStart(2, '0');
        const formattedDay = day.padStart(2, '0');
        dueDate = `${formattedMonth}/${formattedDay}/${year}`;
    }

    // Format the book entry as "[title of book] Due: [due date MM/DD/YYYY]"
    const newBookEntry = `${title} Due: ${dueDate}`;

    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        document.getElementById('error-msg').textContent = 'User not logged in';
        return;
    }

    // Fetch the current borrowed books for the user
    const { data, error } = await supabase
        .from('table2')
        .select('Borrowed_Books_Borrower')
        .eq('id', user.id)
        .single();

    if (error) {
        document.getElementById('error-msg').textContent = 'Error fetching borrower data';
        return;
    }

    // Get the current list of borrowed books, or initialize to an empty array
    let borrowedBooks = data.Borrowed_Books_Borrower || [];

    // Check if the new book entry already exists
    const bookIndex = borrowedBooks.indexOf(newBookEntry);
    let actionTaken = '';
    if (bookIndex > -1) {
        // Remove the book from the array if it exists
        borrowedBooks.splice(bookIndex, 1);
        actionTaken = 'removed';
    } else {
        // Add the new book entry if it does not exist
        borrowedBooks.push(newBookEntry);
        actionTaken = 'added';
    }

    // Update the Borrowed_Books_Borrower column in table2 using the "id" column
    const { error: updateError } = await supabase
        .from('table2')
        .update({ Borrowed_Books_Borrower: borrowedBooks })
        .eq('id', user.id);

    if (updateError) {
        console.error('Update error:', updateError.message);
        document.getElementById('error-msg').textContent = `Update error: ${updateError.message}`;
        return;
    } else {
        // Clear inputs and display a success message
        document.getElementById('bookTitles').value = '';
        document.getElementById('dueDates').value = '';
        document.getElementById('error-msg').textContent = `Book ${actionTaken} successfully`;
    }
});