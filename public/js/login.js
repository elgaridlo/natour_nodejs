import axios from 'axios'
import {showAlert} from './alerts'

export const login = async (email, password) => {
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
            showAlert('success', 'LoggedIn successfully')
            window.setTimeout(() => {
                location.assign('/')
            },100)
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}
