const userModel = require("../model/userModel")
const jwt = require("jsonwebtoken");


const isValid = function (value) {
  if (typeof value === "undefined" || value === null || typeof value === "number") return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true
}
const addressValid = function (data) {
  return !(data && (typeof data == "number" || typeof data == "boolean" || data.trim().length == 0))
}



//=========================================== 1-Create User Api =================================================//


const createUser = async function (req, res) {
  try {
    const data = req.body;

    if (Object.keys(data).length == 0) {
      return res.status(400).send({ status: false, message: "Body cannot be empty" });
    }


    // Checks whether title is empty or is enter as a string or contains the enumerator values or not.
    let titles = ["Mr", "Mrs", "Miss"];
    if (!isValid(data.title)) {
      return res.status(400).send({ status: false, message: " Please enter valid Title" });
    }
    data.title = data.title.trim();
    if (!titles.includes(data.title)) {
      return res.status(400).send({ status: false, message: "Please enter title as Mr, Mrs or Miss only", });
    }


    // Checks whether data name is empty or is enter as a string or contains only letters
    if (!isValid(data.name)) {
      return res.status(400).send({ status: false, message: "Please enter valid user name" });
    }
    let validname = /^\w[a-zA-Z.,\s]*$/;
    data.name = data.name.trim();
    if (!validname.test(data.name)) {
      return res.status(400).send({ status: false, message: "The user name may contain only letters" });
    }


    //    phone validations
    if (!isValid(data.phone)) {
      return res.status(400).send({ status: false, message: "Please Enter valid Phone Number" });
    }
    let validPhone = /^(\+?\d{1,4}[\s-])?(?!0+\s+,?$)\d{10}\s*,?$/
    if (!validPhone.test(data.phone)) {
      return res.status(400).send({ status: false, message: "The user phone number should be indian may contain only 10 number" });
    }
    let phone = data.phone.trim();
    let duplicatePhone = await userModel.findOne({ phone: phone });
    if (duplicatePhone) {
      return res.status(400).send({ status: false, message: `${phone} already exists` });
    }


    // email validations
    if (!isValid(data.email)) {
      return res.status(400).send({ status: false, message: "Please enter valid E-mail" });
    }
    let email = data.email.trim();
    if (!/^([0-9a-z]([-_\\.]*[0-9a-z]+)*)@([a-z]([-_\\.]*[a-z]+)*)[\\.]([a-z]{2,9})+$/.test(email)) {
      return res.status(400).send({ status: false, message: "Entered email is invalid" });
    }
    let duplicateEmail = await userModel.findOne({ email: email });
    if (duplicateEmail) {
      return res.status(400).send({ status: false, message: `${email} already exists` });
    }


    // Checks whether password is empty or is enter as a string or a valid pasword.
    if (!isValid(data.password)) {
      return res.status(400).send({ status: false, message: "Please enter valid Password" });
    }
    let validPassword = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,15}$/;
    if (!validPassword.test(data.password)) {
      return res.status(400).send({ status: false, message: "Please enter min 8 letter password, with at least a symbol, upper and lower case letters and a number" });
    }


    // check address validations
    if (data.address) {
      if (Object.keys(data.address).length == 0) {
        return res.status(400).send({ status: false, message: "Address cannot be empty" });
      }
      if (typeof data.address != "object") {
        return res.status(400).send({ status: false, msg: "Address body  should be in object form" });
      }
      if (!addressValid(data.address.street)) {
        return res.status(400).send({ status: false, message: "street value should not be a number or boolean or empty space" })
      }
      if (!/^\d*[a-zA-Z\d\s,.]*$/.test(data.address.street)) {
        return res.status(400).send({ status: false, message: "The street name may contain only letters" });
      }
      if (!addressValid(data.address.city)) {
        return res.status(400).send({ status: false, message: "city value should not be a number or boolean or empty space" })
      }
      if (!/^\w[a-zA-Z.,\s]*$/.test(data.address.city)) {
        return res.status(400).send({ status: false, message: "The city name may contain only letters" });
      }
      if (!addressValid(data.address.pincode)) {
        return res.status(400).send({ status: false, message: "pincode value should not be a number or boolean or empty space" })
      }
      data.address.pincode = data.address.pincode;
      if (data.address.pincode != undefined && !(/^[1-9][0-9]{5}$/.test(data.address.pincode))) {
        return res.status(400).send({ status: false, message: " Please Enter Valid Pincode Of 6 Digits" });
      }
    }


    //user creation
    let savedData = await userModel.create(data)
    return res.status(201).send({ status: true, data: savedData })
  }
  catch (err) {
    console.log(err)
    return res.status(500).send({ status: false, msg: err.message })
  }
}



//========================================= 2-Login and Token Generation Api =====================================//


const loginUser = async function (req, res) {
  try {
    let data = req.body
    let email = req.body.email
    let password = req.body.password

    if (Object.keys(data).length == 0) {
      return res.status(400).send({ status: false, message: "Body cannot be empty" });
    }

    // Checks whether email is entered or not
    if (!email) {
      return res.status(400).send({ status: false, msg: "Please enter E-mail" });
    }
    // Checks whether password is entered or not
    if (!password) {
      return res.status(400).send({ status: false, msg: "Please enter Password" });
    }

    //Finding credentials 
    let user = await userModel.findOne({ email: email, password: password })
    if (!user) {
      return res.status(401).send({ status: false, msg: "Invalid email or password" })
    }

    //Token generation
    let token = jwt.sign({
      userId: user._id.toString(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7600
    },
      "4A group"
    );
    // res.setHeader("x-api-key", token);

    return res.status(200).send({ status: true, data: { token } });
  }
  catch (err) {
    return res.status(500).send({ status: false, msg: err.message })
  }
};


module.exports = { createUser, loginUser }