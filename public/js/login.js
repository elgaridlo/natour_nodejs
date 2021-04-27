const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data: {
                email, password
            }
        })
        console.log(res.data)
        if(res.data.status === 'Success') {
            window.setTimeout(() => {
                location.assign('/')
            },100)
        }
    } catch (err) {
        alert(err.response.data.message)
    }
}

document.querySelector('.form').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log('email = ', email)
    console.log('password = ', password)
    login(email, password)
})