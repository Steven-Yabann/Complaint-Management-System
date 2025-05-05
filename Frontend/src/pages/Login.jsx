import React from "react";
import { Link } from "react-router-dom";

const Login=() =>{
    return(
    <div class='main-container'>
        <h1>Login</h1>
        <form>
            <div class='username'>
                <label>Username</label>
                <input type="text"/>
                </div>

                <div class='password'>
                <label>Password</label>
                <input type="password"/>
                </div>

        </form>
    </div>

    );


};




export default Login;