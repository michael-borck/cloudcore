function setCookie(name, value, hours) {
    const date = new Date();
    date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function goBack() {
    history.back();
}

const correctPassword = 'yourPasswordHere';  // Replace 'yourPasswordHere' with your actual password

function checkPassword() {
    if (getCookie("authenticated") === "true") {
        console.log('Already authenticated');
        return; // Already authenticated, no need to ask for password
    }

    const userPassword = prompt('Please enter the password to access this page:');
    if (userPassword === null) {
        document.body.innerHTML = '';
        goBack();  // User pressed Cancel, go back to the previous page
    } else if (userPassword !== correctPassword) {
        document.body.innerHTML = '<h1>Access Denied</h1>';  // Display access denied message in the body
        setTimeout(goBack, 3000);  // Wait for 3 seconds and then go back
    } else {
        setCookie("authenticated", "true", 24);  // Set a cookie for 24 hours
    }
}

checkPassword();