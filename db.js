import mongoose from "mongoose";

function connectedDB(){
    mongoose.connect("mongodb+srv://sabihop56:Mypassword12@cluster0.vfwnugr.mongodb.net/ecommerce?retryWrites=true&w=majority").then(()=>{
        console.log('connected to database ')
    }).catch(()=>{
        console.log('ni hua connect')
    })
}
export default connectedDB