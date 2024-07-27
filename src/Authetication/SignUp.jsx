import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
const {width, height} = Dimensions.get('window');
import axios from 'axios';

const SignUp = () => {
  const [showOtp, setShowOtp] = useState(true);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];
  const [phoneNumber, setPhoneNumber] = useState('');

  const SendOTP = async () => {
    try {
      const obj = {
        firstName: 'John',
        address: '123 Main St, City, Country',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        dob: '1990-01-01',
        mobileNo: 1234567890,
        gender: 'male',
        empId: 'EMP001',
        companyId: '669e45accf397936fa5b2c43', // Replace with an actual ObjectId if available
        role: 'Developer',
        employeeType: 'full-time',
        designation: 'Software Engineer',
        department: 'IT',
        profilePhoto: {
          img: 'profile-photo-url',
        },
        maritalStatus: 'unmarried',
        workStatus: 'experienced',
        workExperience: {
          years: 5,
          months: 6,
        },
        specialyAbled: {
          isSpeciallyAbled: false,
          description: '',
        },
        isPresent: true,
      };

      const response = await axios.post('http://192.168.0.242:4002/api/', obj);
      if (response.data.success === true) {
        const responseData = response.data.response;
        setShowOtp(false);
      } else {
        console.error('Something Went Wrong!');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOTPChange = (text, index) => {
    if (text.length >= 1 && index < 5) {
      if (text.length == 1) {
        otp[index] = text;
        setOtp([...otp]);
        otpInputs[index + 1].current.focus();
      } else if (text.length == 2) {
        otp[index] = text.slice(0, 1);
        otp[index + 1] = text.slice(1, 2);
        setOtp([...otp]);
        otpInputs[index + 1].current.focus();
      }
    } else if (text.length >= 1 && index == 5) {
      otp[index] = text.slice(0, 1);
      setOtp([...otp]);
      otpInputs[index].current.focus();
    } else if (index > 0) {
      otp[index] = text;
      setOtp([...otp]);
      otpInputs[index - 1].current.focus();
    } else {
      otp[index] = text;
      setOtp([...otp]);
      otpInputs[0].current.focus();
    }
  };

  const VerifyOTP = () => {
    try {
      console.log(67678);
    } catch (error) {
      console.error('something went wrong');
    }
  };

  return (
    <View style={styles.container}>
      {showOtp ? (
        <View style={styles.form_container}>
          <View style={styles.Background_container}>
            <View style={{alignItems: 'center'}}>
              <View>
                <View style={styles.Heading}>
                  <Text
                    style={{
                      textAlign: 'center',
                      paddingBottom: 10,
                      fontSize: 18,
                      fontWeight: 500,
                    }}>
                    Sign In
                  </Text>
                </View>
                <View>
                  <TextInput
                    placeholder="Enter Mobile Number"
                    style={styles.input}
                    keyboardType="numeric"
                    onChangeText={text => {
                      if (text.length < 11 && /^\d*$/.test(text)) {
                        setPhoneNumber(text);
                      }
                    }}
                    value={phoneNumber}
                  />
                </View>
              </View>
            </View>
            <View style={{gap: 8}}>
              <TouchableOpacity onPress={SendOTP} style={styles.OtpBtn}>
                <Text>Send OTP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.form_container}>
          <View style={styles.otpForm_container}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={otpInputs[index]}
                style={{
                  ...styles.otpInput,
                  borderBottomWidth: 1,
                  borderColor: '#333',
                  marginRight: 8,
                  width: 40,
                  height: 40,
                  textAlign: 'center',
                  color: '#3333',
                }}
                keyboardType="numeric"
                onChangeText={text => handleOTPChange(text, index)}
                value={digit}
                maxLength={1}
              />
            ))}
          </View>
          <TouchableOpacity>
            <View style={styles.OtpBtn} onPress={() => VerifyOTP()}>
              <Text>Verify & Sign In</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  logo: {
    resizeMode: 'cover',
    width: 126.818,
    height: 30,
  },
  container: {
    //   flex: 1,
    backgroundColor: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  Background_container: {
    width: width,
    // height: height,
    flexShrink: 0,
    resizeMode: 'cover',
    position: 'relative',
    alignItems: 'center',
    //   justifyContent: 'space-between',
    paddingBottom: 50,
    gap: 16,
  },
  otpForm_container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  form_container: {
    display: 'flex',
    width: '94%',
    padding: 16,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    gap: 16,
    borderRadius: 8,
    //   backgroundColor: 'rgba(159, 159, 159, 0.40)',
    marginTop: 30,
  },
  terms_Condition: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    // flex: 1,
  },
  input: {
    display: 'flex',
    width: 312,
    height: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    textAlign: 'left',
    gap: 10,
    flexShrink: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#9D9D9D',
    // border: 1px solid var(--placeholder, #9D9D9D);
    backgroundColor: '#FFF',
  },
  OtpBtn: {
    display: 'flex',
    width: 312,
    height: 44,
    paddingVerticle: 4,
    paddingHorizontal: 16,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 6,
    backgroundColor: '#E92E4F',
  },
  loginBtn: {
    display: 'flex',
    width: 312,
    height: 44,
    paddingVerticle: 16,
    paddingHorizontal: 4,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    borderRadius: 6,
    backgroundColor: '#FFF',
  },
  androidBackdrop: {
    backgroundColor: '#0000006e',
    // opacity: 0.6,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  addAddress_model_container: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
  },
  otpInput: {
    fontSize: 20,
    textAlign: 'center',
    // opacity: 0.3,
    borderBottomColor: '#FFF',
    borderBottomWidth: 3,
    // borderBottomStyle: 'solid',
    display: 'flex',
    height: 80,
    // paddingVerticle: 20,
    // paddingHorizontal: 26,4534
    // padding: 20px 26px;
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    // gap: 10,
    // flex: 1,
    backgroundColor: 'transparent',
    color: '#fff',
  },
});
