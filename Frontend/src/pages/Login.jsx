import React from "react";
import { Link } from "react-router-dom";
import '../styling/login.css';

const Login=() =>{
    return(
    <div className='main-container'>
        
        <form className="login-form">
        <h1>Login</h1>
            <div class='username'>
                <label>👤</label>
                <input type="text" className="input"/>
                </div>

                <div class='password' >
                <label>🔒</label>
                <input type="password" className="input"/>
                </div>
            <p>Dont have an account? Time to 
                <br></br>
                <button className='register-button'type='input'>Register</button></p>
               
        </form>
    </div>

    );


};




export default Login;