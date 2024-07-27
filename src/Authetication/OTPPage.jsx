import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
const {width, height} = Dimensions.get('window');
import GlobalStyle from '../../common/style/Font';
import {useRoute} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {toastMessage} from '../../utils/services';
import axios from 'axios';
import auth from '@react-native-firebase/auth';
import firebase from '@react-native-firebase/app';
import {useDispatch} from 'react-redux';
import {
  incNumber,
  reCallCart,
  setAllProducts,
  setTag,
  setVendor,
} from '../../Redux/actions';

const OTP = ({navigation}) => {
  const route = useRoute();
  const dispatch = useDispatch();
  const confirm = route.params.confirm;
  const phoneNumber = route.params.phoneNumber;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(59);
  const [timerRunning, setTimerRunning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [code, setCode] = useState('');
  const [otpConfirmed, setOtpConfirmed] = useState(false); // State to track OTP confirmation
  const otpInputs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(user => {
      if (user) {
        // confirmVerificationCode();
        // login();
      } else {
        setIsLogged(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let timerInterval = setInterval(() => {
      if (minutes === 0 && seconds === 0) {
        clearInterval(timerInterval);
        setTimerRunning(false);
      } else {
        if (seconds === 0) {
          setSeconds(60);
          setMinutes(prevMinutes => prevMinutes - 1);
        } else {
          setSeconds(prevSeconds => prevSeconds - 1);
        }
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [minutes, seconds]);

  async function confirmVerificationCode() {
    setLoading(true);
    try {
      await confirm.confirm(otp.join(''));
      console.log('OTP confirmed successfully');
      setOtpConfirmed(true);
      login();
    } catch (error) {
      if (error.code === 'auth/invalid-verification-code') {
        toastMessage('error', 'Invalid OTP');
      }
      setLoading(false);
    }
  }

  const AddressSetHandler = async data => {
    try {
      const res = await axios.get(
        `https://jamblix.in/api/address/getByUserId/${data.user._id}`,
        {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        },
      );

      const response = res.data.data[0];
      if (response) {
        await AsyncStorage.setItem('address', JSON.stringify(response));
        await AsyncStorage.setItem('addressLocated', JSON.stringify(true));
        await AsyncStorage.setItem(
          'activeAddress',
          JSON.stringify(response._id),
        );
        await AsyncStorage.setItem(
          'locatedPincode',
          JSON.stringify(response.pincode),
        );
        const pincode = response.pincode;
        if (pincode) {
          const allVendorsResponse = await axios.get(
            'https://jamblix.in/api/vendor/getAll',
          );
          const allVendors = allVendorsResponse.data.data;
          const findVendor = allVendors.find(item =>
            item.serviceablePincode.includes(pincode.toString()),
          );
          if (findVendor) {
            const vendorId = findVendor._id;
            await AsyncStorage.setItem('vendorId', vendorId);
            const vendorDataResponse = await axios.get(
              `https://jamblix.in/api/getVendorById/${vendorId}`,
            );
            const vendorData = vendorDataResponse.data.data;
            const vendorPro = vendorData.products;
            const tags = vendorData.tags;
            dispatch(setVendor(vendorData));
            dispatch(setAllProducts(vendorPro));
            dispatch(setTag(tags));
          }
        }
        await AsyncStorage.setItem(
          'locatedLandMark',
          JSON.stringify(response.landMark),
        );
        await AsyncStorage.setItem(
          'activeAddress',
          JSON.stringify(response._id),
        );
      } else {
        await AsyncStorage.setItem('addressLocated', JSON.stringify(false));
      }
      dispatch(incNumber());
      dispatch(reCallCart());
      toastMessage('success', 'Login Successfully');
      setIsLogged(true);
      setLoading(false);
      navigation.navigate('HomePage');
    } catch (error) {
      console.log('Error occurred while fetching user address data:', error);
      // Handle error appropriately, e.g., show an error message
    }
  };

  const login = () => {
    axios
      .post('https://jamblix.in/api/user/signup', {
        mobileNo: parseInt(phoneNumber),
      })
      .then(async res => {
        console.log(88, res.data);
        if (res.data.success === true) {
          const response = res.data.response;
          try {
            await AsyncStorage.setItem(
              'authResponse',
              JSON.stringify(response),
            );

            await AddressSetHandler(response);
          } catch (e) {
            toastMessage('error', 'Unable To Login');
          }
        }
      })
      .catch(err => {
        toastMessage('error', err);
        console.error(33, err);
      });
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

  const resendOtp = async () => {
    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(
        `+91 ${phoneNumber}`,
      );
      if (confirmation) {
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true); // Keyboard is open
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false); // Keyboard is closed
      },
    );

    // Clean up function
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1}}>
      <View style={styles.otp_container}>
        <ImageBackground
          source={require('../../assets/meatImages/OtpBck.png')}
          style={styles.Background_container}>
          <View
            style={{
              padding: 6,
              display: 'flex',
              paddingVertical: 16,
              paddingLeft: 8,
            }}>
            <ImageBackground
              source={require('../../assets/meatImages/logo.png')}
              style={styles.logo}
            />
          </View>
          <View
            style={{
              paddingHorizontal: 8,
              height: height - 62,
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 40,
            }}>
            <View style={styles.FormField}>
              <View>
                <Text style={{...GlobalStyle.f_26, color: '#FFF'}}>
                  OTP Verification
                </Text>
              </View>
              <View style={styles.text_container}>
                <Text style={{...GlobalStyle.f_12, color: '#FFF'}}>
                  Check your SMS messages. We've sent
                </Text>
                <Text style={{...GlobalStyle.f_12, color: '#FFF'}}>
                  you the pin at +91{' '}
                  {phoneNumber.toString().split('').slice(0, 2).join('')}*
                  {phoneNumber.toString().split('').slice(-2).join('')}
                </Text>
              </View>
              <View style={styles.otpForm_container}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={otpInputs[index]}
                    style={{
                      ...styles.otpInput,
                      borderBottomWidth: 1,
                      borderColor: '#fff',
                      marginRight: 8,
                      width: 40,
                      height: 40,
                      textAlign: 'center',
                      color: '#FFF',
                    }}
                    keyboardType="numeric"
                    onChangeText={text => handleOTPChange(text, index)}
                    value={digit}
                    maxLength={1}
                  />
                ))}
              </View>
              <View style={{gap: 8}}>
                <Text style={{...GlobalStyle.f_12, color: '#FFF'}}>
                  Didn’t you receive any code?
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (!timerRunning) {
                        if (phoneNumber) {
                          resendOtp();
                        }
                      }
                    }}>
                    <Text
                      style={{
                        ...GlobalStyle.f_12,
                        color: '#FFF',
                        fontWeight: 700,
                      }}>
                      Re-send Code
                    </Text>
                  </TouchableOpacity>
                  {timerRunning && (
                    <Text style={{color: '#E92E4F', fontWeight: 600}}>
                      {' '}
                      {`${minutes.toString().padStart(2, '0')}:${seconds
                        .toString()
                        .padStart(2, '0')}`}
                    </Text>
                  )}
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={confirmVerificationCode}>
              <View style={styles.verifyBtn}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{...GlobalStyle.f_18, color: '#FFF'}}>
                    Verify & Sign In
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            {isKeyboardVisible && <View style={{height: 40}} />}
          </View>
        </ImageBackground>
      </View>
    </KeyboardAvoidingView>
  );
};
export default OTP;

const styles = StyleSheet.create({
  otp_container: {
    flex: 1,
  },
  Background_container: {
    width: '100%',
    height: '100%',
  },
  logo: {
    resizeMode: 'cover',
    width: 126.818,
    height: 30,
  },
  FormField: {
    display: 'flex',
    padding: 16,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(159, 159, 159, 0.55)',
    opacity: 0.7,
  },
  otpForm_container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  otpInput: {
    // fontSize: 26,
    // textAlign: 'center',
    // // opacity: 0.3,
    // borderBottomColor: '#FFF',
    // borderBottomWidth: 3,
    // // borderBottomStyle: 'solid',
    // display: 'flex',
    // height: 60,
    // // paddingVerticle: 20,
    // // paddingHorizontal: 26,
    // // padding: 20px 26px;
    // flexDirection: 'column',
    // justifyContent: 'center',
    // alignItems: 'center',
    // // gap: 10,
    // // flex: 1,
    // backgroundColor: 'transparent',
    // color: '#fff',
  },
  verifyBtn: {
    display: 'flex',
    width: 312,
    height: 44,
    paddingVerticle: 4,
    paddingHorizontal: 16,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    borderRadius: 6,
    backgroundColor: '#E92E4F',
  },
  borderStyleBase: {
    width: 40,
    height: 45,
  },

  borderStyleHighLighted: {
    borderColor: '#03DAC6',
  },

  underlineStyleBase: {
    borderWidth: 0,
    borderBottomWidth: 3,
    height: 60,
    marginHorizontal: 4,
  },

  underlineStyleHighLighted: {
    borderColor: '#03DAC6',
  },
});

// import React, {useState, useRef, useEffect} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ImageBackground,
//   Dimensions,
//   TouchableOpacity,
//   TextInput,
//   ActivityIndicator,
//   ScrollView,
//   Platform,
//   KeyboardAvoidingView,
//   Keyboard,
// } from 'react-native';
// const {width, height} = Dimensions.get('window');
// import GlobalStyle from '../../common/style/Font';
// import {useRoute} from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {toastMessage} from '../../utils/services';
// import axios from 'axios';
// import auth from '@react-native-firebase/auth';
// import firebase from '@react-native-firebase/app';
// import {useDispatch} from 'react-redux';
// import {
//   incNumber,
//   reCallCart,
//   setAllProducts,
//   setTag,
//   setVendor,
// } from '../../Redux/actions';

// const OTP = ({navigation}) => {
//   const route = useRoute();
//   const dispatch = useDispatch();
//   const confirm = route.params.confirm;
//   const phoneNumber = route.params.phoneNumber;
//   const [otp, setOtp] = useState(['', '', '', '', '', '']);
//   const [minutes, setMinutes] = useState(0);
//   const [seconds, setSeconds] = useState(59);
//   const [timerRunning, setTimerRunning] = useState(true);
//   const [loading, setLoading] = useState(false);
//   const [isLogged, setIsLogged] = useState(false);
//   const [code, setCode] = useState('');
//   const [otpConfirmed, setOtpConfirmed] = useState(false); // State to track OTP confirmation
//   const otpInputs = [
//     useRef(null),
//     useRef(null),
//     useRef(null),
//     useRef(null),
//     useRef(null),
//     useRef(null),
//   ];

//   useEffect(() => {
//     const unsubscribe = firebase.auth().onAuthStateChanged(user => {
//       if (user) {
//         // confirmVerificationCode();
//         login();
//       } else {
//         setIsLogged(false);
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     let timerInterval = setInterval(() => {
//       if (minutes === 0 && seconds === 0) {
//         clearInterval(timerInterval);
//         setTimerRunning(false);
//       } else {
//         if (seconds === 0) {
//           setSeconds(60);
//           setMinutes(prevMinutes => prevMinutes - 1);
//         } else {
//           setSeconds(prevSeconds => prevSeconds - 1);
//         }
//       }
//     }, 1000);

//     return () => clearInterval(timerInterval);
//   }, [minutes, seconds]);

//   async function confirmVerificationCode() {
//     setLoading(true);
//     try {
//       await confirm.confirm(otp.join(''));
//       console.log('OTP confirmed successfully');
//       setOtpConfirmed(true);
//       login();
//     } catch (error) {
//       if (error.code === 'auth/invalid-verification-code') {
//         toastMessage('error', 'Invalid OTP');
//       }
//       setLoading(false);
//     }
//   }

//   const AddressSetHandler = async data => {
//     try {
//       const res = await axios.get(
//         `https://jamblix.in/api/address/getByUserId/${data.user._id}`,
//         {
//           headers: {
//             Authorization: `Bearer ${data.token}`,
//           },
//         },
//       );

//       const response = res.data.data[0];
//       if (response) {
//         await AsyncStorage.setItem('address', JSON.stringify(response));
//         await AsyncStorage.setItem('addressLocated', JSON.stringify(true));
//         await AsyncStorage.setItem(
//           'activeAddress',
//           JSON.stringify(response._id),
//         );
//         await AsyncStorage.setItem(
//           'locatedPincode',
//           JSON.stringify(response.pincode),
//         );
//         const pincode = response.pincode;
//         if (pincode) {
//           const allVendorsResponse = await axios.get(
//             'https://jamblix.in/api/vendor/getAll',
//           );
//           const allVendors = allVendorsResponse.data.data;
//           const findVendor = allVendors.find(item =>
//             item.serviceablePincode.includes(pincode.toString()),
//           );
//           if (findVendor) {
//             const vendorId = findVendor._id;
//             await AsyncStorage.setItem('vendorId', vendorId);
//             const vendorDataResponse = await axios.get(
//               `https://jamblix.in/api/getVendorById/${vendorId}`,
//             );
//             const vendorData = vendorDataResponse.data.data;
//             const vendorPro = vendorData.products;
//             const tags = vendorData.tags;
//             dispatch(setVendor(vendorData));
//             dispatch(setAllProducts(vendorPro));
//             dispatch(setTag(tags));
//           }
//         }
//         await AsyncStorage.setItem(
//           'locatedLandMark',
//           JSON.stringify(response.landMark),
//         );
//         await AsyncStorage.setItem(
//           'activeAddress',
//           JSON.stringify(response._id),
//         );
//       } else {
//         await AsyncStorage.setItem('addressLocated', JSON.stringify(false));
//       }
//       dispatch(incNumber());
//       dispatch(reCallCart());

//       setIsLogged(true);
//       setLoading(false);
//     } catch (error) {
//       console.log('Error occurred while fetching user address data:', error);
//       // Handle error appropriately, e.g., show an error message
//     }
//   };

//   const login = () => {
//     axios
//       .post('https://jamblix.in/api/user/signup', {
//         mobileNo: parseInt(phoneNumber),
//       })
//       .then(async res => {
//         if (res.data.success === true) {
//           const response = res.data.response;
//           try {
//             await AsyncStorage.setItem(
//               'authResponse',
//               JSON.stringify(response),
//             );
//             await AddressSetHandler(response);
//             toastMessage('success', 'Login Successfully');
//             navigation.navigate('HomePage');
//           } catch (e) {
//             toastMessage('error', 'Unable To Login');
//           }
//         }
//       })
//       .catch(err => {
//         toastMessage('error', err);
//         console.error(33, err);
//       });
//   };

//   const handleOTPChange = (text, index) => {
//     if (text.length >= 1 && index < 5) {
//       if (text.length == 1) {
//         otp[index] = text;
//         setOtp([...otp]);
//         otpInputs[index + 1].current.focus();
//       } else if (text.length == 2) {
//         otp[index] = text.slice(0, 1);
//         otp[index + 1] = text.slice(1, 2);
//         setOtp([...otp]);
//         otpInputs[index + 1].current.focus();
//       }
//     } else if (text.length >= 1 && index == 5) {
//       otp[index] = text.slice(0, 1);
//       setOtp([...otp]);
//       otpInputs[index].current.focus();
//     } else if (index > 0) {
//       otp[index] = text;
//       setOtp([...otp]);
//       otpInputs[index - 1].current.focus();
//     } else {
//       otp[index] = text;
//       setOtp([...otp]);
//       otpInputs[0].current.focus();
//     }
//   };

//   const resendOtp = async () => {
//     setLoading(true);
//     try {
//       const confirmation = await auth().signInWithPhoneNumber(
//         `+91 ${phoneNumber}`,
//       );
//       if (confirmation) {
//         setLoading(false);
//       }
//     } catch (error) {
//       console.log(error);
//       setLoading(false);
//     }
//   };
//   const [isKeyboardVisible, setKeyboardVisible] = useState(false);
//   useEffect(() => {
//     const keyboardDidShowListener = Keyboard.addListener(
//       'keyboardDidShow',
//       () => {
//         setKeyboardVisible(true); // Keyboard is open
//       },
//     );
//     const keyboardDidHideListener = Keyboard.addListener(
//       'keyboardDidHide',
//       () => {
//         setKeyboardVisible(false); // Keyboard is closed
//       },
//     );

//     // Clean up function
//     return () => {
//       keyboardDidShowListener.remove();
//       keyboardDidHideListener.remove();
//     };
//   }, []);

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       style={{flex: 1}}>
//       <View style={styles.otp_container}>
//         <ImageBackground
//           source={require('../../assets/meatImages/OtpBck.png')}
//           style={styles.Background_container}>
//           <View
//             style={{
//               padding: 6,
//               display: 'flex',
//               paddingVertical: 16,
//               paddingLeft: 8,
//             }}>
//             <ImageBackground
//               source={require('../../assets/meatImages/logo.png')}
//               style={styles.logo}
//             />
//           </View>
//           <View
//             style={{
//               paddingHorizontal: 8,
//               height: height - 62,
//               justifyContent: 'space-between',
//               alignItems: 'center',
//               paddingBottom: 40,
//             }}>
//             <View style={styles.FormField}>
//               <View>
//                 <Text style={{...GlobalStyle.f_26, color: '#FFF'}}>
//                   OTP Verification
//                 </Text>
//               </View>
//               <View style={styles.text_container}>
//                 <Text style={{...GlobalStyle.f_12, color: '#FFF'}}>
//                   Check your SMS messages. We've sent
//                 </Text>
//                 <Text style={{...GlobalStyle.f_12, color: '#FFF'}}>
//                   you the pin at +91{' '}
//                   {phoneNumber.toString().split('').slice(0, 2).join('')}*
//                   {phoneNumber.toString().split('').slice(-2).join('')}
//                 </Text>
//               </View>
//               <View style={styles.otpForm_container}>
//                 {otp.map((digit, index) => (
//                   <TextInput
//                     key={index}
//                     ref={otpInputs[index]}
//                     style={{
//                       ...styles.otpInput,
//                       borderBottomWidth: 1,
//                       borderColor: '#fff',
//                       marginRight: 8,
//                       width: 40,
//                       height: 40,
//                       textAlign: 'center',
//                       color: '#FFF',
//                     }}
//                     keyboardType="numeric"
//                     onChangeText={text => handleOTPChange(text, index)}
//                     value={digit}
//                     maxLength={1}
//                   />
//                 ))}
//               </View>
//               <View style={{gap: 8}}>
//                 <Text style={{...GlobalStyle.f_12, color: '#FFF'}}>
//                   Didn’t you receive any code?
//                 </Text>
//                 <View
//                   style={{
//                     flexDirection: 'row',
//                     justifyContent: 'center',
//                     alignItems: 'center',
//                   }}>
//                   <TouchableOpacity
//                     onPress={() => {
//                       if (!timerRunning) {
//                         if (phoneNumber) {
//                           resendOtp();
//                         }
//                       }
//                     }}>
//                     <Text
//                       style={{
//                         ...GlobalStyle.f_12,
//                         color: '#FFF',
//                         fontWeight: 700,
//                       }}>
//                       Re-send Code
//                     </Text>
//                   </TouchableOpacity>
//                   {timerRunning && (
//                     <Text style={{color: '#E92E4F', fontWeight: 600}}>
//                       {' '}
//                       {`${minutes.toString().padStart(2, '0')}:${seconds
//                         .toString()
//                         .padStart(2, '0')}`}
//                     </Text>
//                   )}
//                 </View>
//               </View>
//             </View>
//             <TouchableOpacity onPress={confirmVerificationCode}>
//               <View style={styles.verifyBtn}>
//                 {loading ? (
//                   <ActivityIndicator size="small" color="#fff" />
//                 ) : (
//                   <Text style={{...GlobalStyle.f_18, color: '#FFF'}}>
//                     Verify & Sign In
//                   </Text>
//                 )}
//               </View>
//             </TouchableOpacity>
//             {isKeyboardVisible && <View style={{height: 40}} />}
//           </View>
//         </ImageBackground>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };
// export default OTP;

// const styles = StyleSheet.create({
//   logo: {
//     resizeMode: 'cover',
//     width: 126.818,
//     height: 30,
//   },
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     // display:"flex",
//     // justifyContent:"center",
//     // alignItems:"center",
//   },
//   Background_container: {
//     width: width,
//     height: height,
//     flexShrink: 0,
//     resizeMode: 'cover',
//     position: 'relative',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingBottom: 50,
//   },

//   form_container: {
//     display: 'flex',
//     width: '94%',
//     padding: 16,
//     flexDirection: 'column',
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 16,
//     borderRadius: 8,
//     backgroundColor: 'rgba(159, 159, 159, 0.40)',
//     marginTop: 30,
//   },
//   terms_Condition: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 2,
//     // flex: 1,
//   },
//   input: {
//     display: 'flex',
//     width: 312,
//     height: 44,
//     paddingHorizontal: 16,
//     alignItems: 'center',
//     textAlign: 'left',
//     gap: 10,
//     flexShrink: 0,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderStyle: 'solid',
//     borderColor: '#9D9D9D',
//     // border: 1px solid var(--placeholder, #9D9D9D);
//     backgroundColor: '#FFF',
//   },
//   OtpBtn: {
//     display: 'flex',
//     width: 312,
//     height: 44,
//     paddingVerticle: 4,
//     paddingHorizontal: 16,
//     flexDirection: 'column',
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 8,
//     borderRadius: 6,
//     backgroundColor: '#E92E4F',
//   },
//   loginBtn: {
//     display: 'flex',
//     width: 312,
//     height: 44,
//     paddingVerticle: 16,
//     paddingHorizontal: 4,
//     flexDirection: 'column',
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 8,
//     flexShrink: 0,
//     borderRadius: 6,
//     backgroundColor: '#FFF',
//   },
//   androidBackdrop: {
//     backgroundColor: '#0000006e',
//     // opacity: 0.6,
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   backdrop: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     zIndex: 1000,
//   },
//   addAddress_model_container: {
//     backgroundColor: '#fff',
//     width: '80%',
//     borderRadius: 16,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 24,
//     gap: 16,
//   },
//   otp_container: {
//     flex: 1,
//   },

//   FormField: {
//     display: 'flex',
//     padding: 16,
//     flexDirection: 'column',
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 16,
//     borderRadius: 8,
//     backgroundColor: 'rgba(159, 159, 159, 0.55)',
//     opacity: 0.7,
//   },
//   otpForm_container: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },

//   otpInput: {
//     // fontSize: 26,
//     // textAlign: 'center',
//     // // opacity: 0.3,
//     // borderBottomColor: '#FFF',
//     // borderBottomWidth: 3,
//     // // borderBottomStyle: 'solid',
//     // display: 'flex',
//     // height: 60,
//     // // paddingVerticle: 20,
//     // // paddingHorizontal: 26,
//     // // padding: 20px 26px;
//     // flexDirection: 'column',
//     // justifyContent: 'center',
//     // alignItems: 'center',
//     // // gap: 10,
//     // // flex: 1,
//     // backgroundColor: 'transparent',
//     // color: '#fff',
//   },
//   verifyBtn: {
//     display: 'flex',
//     width: 312,
//     height: 44,
//     paddingVerticle: 4,
//     paddingHorizontal: 16,
//     flexDirection: 'column',
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 8,
//     flexShrink: 0,
//     borderRadius: 6,
//     backgroundColor: '#E92E4F',
//   },
//   borderStyleBase: {
//     width: 40,
//     height: 45,
//   },
// });

// const styles = StyleSheet.create({
//   otp_container: {
//     flex: 1,
//   },
//   Background_container: {
//     width: '100%',
//     height: '100%',
//     // paddingBottom: ,
//   },
//   logo: {
//     resizeMode: 'cover',
//     width: 126.818,
//     height: 30,
//   },
//   FormField: {
//     display: 'flex',
//     padding: 16,
//     flexDirection: 'column',
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 16,
//     borderRadius: 8,
//     backgroundColor: 'rgba(159, 159, 159, 0.55)',
//     opacity: 0.7,
//   },
//   otpForm_container: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },

//   otpInput: {
//     // fontSize: 26,
//     // textAlign: 'center',
//     // // opacity: 0.3,
//     // borderBottomColor: '#FFF',
//     // borderBottomWidth: 3,
//     // // borderBottomStyle: 'solid',
//     // display: 'flex',
//     // height: 60,
//     // // paddingVerticle: 20,
//     // // paddingHorizontal: 26,
//     // // padding: 20px 26px;
//     // flexDirection: 'column',
//     // justifyContent: 'center',
//     // alignItems: 'center',
//     // // gap: 10,
//     // // flex: 1,
//     // backgroundColor: 'transparent',
//     // color: '#fff',
//   },
//   verifyBtn: {
//     display: 'flex',
//     width: 312,
//     height: 44,
//     paddingVerticle: 4,
//     paddingHorizontal: 16,
//     flexDirection: 'column',
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 8,
//     flexShrink: 0,
//     borderRadius: 6,
//     backgroundColor: '#E92E4F',
//   },
//   borderStyleBase: {
//     width: 40,
//     height: 45,
//   },

//   borderStyleHighLighted: {
//     borderColor: '#03DAC6',
//   },

//   underlineStyleBase: {
//     borderWidth: 0,
//     borderBottomWidth: 3,
//     height: 60,
//     marginHorizontal: 4,
//   },

//   underlineStyleHighLighted: {
//     borderColor: '#03DAC6',
//   },
// });

// import React, {useState, useRef, useEffect} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ImageBackground,
//   Dimensions,
//   TouchableOpacity,
//   TextInput,
//   ActivityIndicator,
//   ScrollView,
// } from 'react-native';
// const {width, height} = Dimensions.get('window');
// import GlobalStyle from '../../common/style/Font';
// import {useRoute} from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {toastMessage} from '../../utils/services';
// import axios from 'axios';
// import auth from '@react-native-firebase/auth';
// import firebase from '@react-native-firebase/app';
// import {
//   incNumber,
//   reCallCart,
//   setAllProducts,
//   setTag,
//   setVendor,
// } from '../../Redux/actions';
// import {useDispatch, useSelector} from 'react-redux';

// const OTP = ({navigation}) => {
//   const route = useRoute();
//   const dispatch = useDispatch();
//   const confirm = route.params.confirm;
//   const phoneNumber = route.params.phoneNumber;
//   const [otp, setOtp] = useState(['', '', '', '', '', '']);
//   const [minutes, setMinutes] = useState(0);
//   const [seconds, setSeconds] = useState(59);
//   const [timerRunning, setTimerRunning] = useState(true);
//   const [loading, setLoading] = useState(false);
//   const [isLogged, setIsLogged] = useState(false);
//   const [code, setCode] = useState('');
//   const [otpConfirmed, setOtpConfirmed] = useState(false);
//   const otpInputs = [
//     useRef(null),
//     useRef(null),
//     useRef(null),
//     useRef(null),
//     useRef(null),
//     useRef(null),
//   ];

//   useEffect(() => {
//     const unsubscribe = firebase.auth().onAuthStateChanged(user => {
//       if (user) {
//         confirmVerificationCode();
//         // login();
//       } else {
//         setIsLogged(false);
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     let timerInterval = setInterval(() => {
//       if (minutes === 0 && seconds === 0) {
//         clearInterval(timerInterval);
//         setTimerRunning(false);
//       } else {
//         if (seconds === 0) {
//           setSeconds(60);
//           setMinutes(prevMinutes => prevMinutes - 1);
//         } else {
//           setSeconds(prevSeconds => prevSeconds - 1);
//         }
//       }
//     }, 1000);

//     return () => clearInterval(timerInterval);
//   }, [minutes, seconds]);

//   async function confirmVerificationCode() {
//     setLoading(true);
//     try {
//       await confirm.confirm(otp.join(''));
//       console.log('OTP confirmed successfully');
//       setOtpConfirmed(true);
//       login();
//     } catch (error) {
//       if (error.code === 'auth/invalid-verification-code') {
//         toastMessage('error', 'The OTP has expired. Please request to Resend.');
//       }
//       // else {
//       //   alert(error);
//       // }
//       setLoading(false);
//     }
//   }

//   const AddressSetHandler = async data => {
//     try {
//       console.log('userData', data.user);
//       const res = await axios.get(
//         `https://jamblix.in/api/address/getByUserId/${data.user._id},
//         {
//           headers: {
//             Authorization: Bearer ${data.token},
//           },
//         }`,
//       );

//       const response = res.data.data[0];
//       console.log(343, response);
//       if (response) {
//         await AsyncStorage.setItem('address', JSON.stringify(response));
//         await AsyncStorage.setItem('addressLocated', JSON.stringify(true));
//         await AsyncStorage.setItem(
//           'activeAddress',
//           JSON.stringify(response._id),
//         );
//         await AsyncStorage.setItem(
//           'locatedPincode',
//           JSON.stringify(response.pincode),
//         );
//         await AsyncStorage.setItem(
//           'locatedLandMark',
//           JSON.stringify(response.landMark),
//         );
//         await AsyncStorage.setItem(
//           'activeAddress',
//           JSON.stringify(response._id),
//         );

//         //get vendor data
//         const pincode = response.pincode;
//         if (pincode) {
//           const allVendorsResponse = await axios.get(
//             'https://jamblix.in/api/vendor/getAll',
//           );
//           console.log(5656, allVendorsResponse);
//           const allVendors = allVendorsResponse.data.data;
//           const findVendor = allVendors.find(item =>
//             item.serviceablePincode.includes(pincode.toString()),
//           );
//           if (findVendor) {
//             const vendorId = findVendor._id;
//             await AsyncStorage.setItem('vendorId', vendorId);
//             const vendorDataResponse = await axios.get(
//               `https://jamblix.in/api/getVendorById/${vendorId}`,
//             );
//             const vendorData = vendorDataResponse.data.data;
//             const vendorPro = vendorData.products;
//             const tags = vendorData.tags;
//             dispatch(setVendor(vendorData));
//             dispatch(setAllProducts(vendorPro));
//             dispatch(setTag(tags));
//           }
//         }
//       } else {
//         await AsyncStorage.setItem('addressLocated', JSON.stringify(false));
//       }
//       dispatch(incNumber());
//       dispatch(reCallCart());
//       console.log(777, 'dispatched action');
//     } catch (error) {
//       console.log('Error occurred while fetching user address data:', error);
//       // Handle error appropriately, e.g., show an error message
//     }
//   };

//   const login = () => {
//     axios
//       .post('https://jamblix.in/api/user/signup', {
//         mobileNo: parseInt(phoneNumber),
//       })
//       .then(async res => {
//         if (res.data.success === true) {
//           const response = res.data.response;
//           try {
//             await AsyncStorage.setItem(
//               'authResponse',
//               JSON.stringify(response),
//             );

//             await AddressSetHandler(response);
//             console.log(9999, 'addressHandled');
//             toastMessage('success', 'Login Successfully');
//             setIsLogged(true);
//             setLoading(false);
//             console.log(9999, 'Now navigate to the homePage');
//             navigation.navigate('HomePage');
//           } catch (e) {
//             toastMessage('error', 'Unable To Login');
//           }
//         }
//       })
//       .catch(err => {
//         toastMessage('error', err);
//         console.error(err);
//       });
//   };

//   const handleOTPChange = (text, index) => {
//     otp[index] = text;
//     setOtp([...otp]);
//     if (text.length === 1 && index < 5) {
//       otpInputs[index + 1].current.focus();
//     }
//   };

//   const resendOtp = async () => {
//     setLoading(true);
//     try {
//       const confirmation = await auth().signInWithPhoneNumber(
//         `+91 ${phoneNumber}`,
//       );
//       if (confirmation) {
//         setLoading(false);
//       }
//     } catch (error) {
//       console.log(error);
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.otp_container}>
//       <ImageBackground
//         source={require('../../assets/meatImages/OtpBck.png')}
//         style={styles.Background_container}>
//         <ScrollView>
//           <View
//             style={{
//               padding: 6,
//               display: 'flex',
//               paddingVertical: 16,
//               paddingLeft: 8,
//             }}>
//             <ImageBackground
//               source={require('../../assets/meatImages/logo.png')}
//               style={styles.logo}
//             />
//           </View>
//           <View
//             style={{
//               paddingHorizontal: 8,
//               height: height - 62,
//               justifyContent: 'space-between',
//               alignItems: 'center',
//               paddingBottom: 40,
//             }}>
//             <View style={styles.FormField}>
//               <View>
//                 <Text style={{...GlobalStyle.f_26, color: '#FFF'}}>
//                   OTP Verification
//                 </Text>
//               </View>
//               <View style={styles.text_container}>
//                 <Text style={{...GlobalStyle.f_12, color: '#FFF'}}>
//                   Check your SMS messages. We've sent
//                 </Text>
//                 <Text style={{...GlobalStyle.f_12, color: '#FFF'}}>
//                   you the pin at +91{' '}
//                   {phoneNumber.toString().split('').slice(0, 2).join('')}*
//                   {phoneNumber.toString().split('').slice(-2).join('')}
//                 </Text>
//               </View>
//               <View style={styles.otpForm_container}>
//                 {otp.map((digit, index) => (
//                   <TextInput
//                     key={index}
//                     ref={otpInputs[index]}
//                     style={{
//                       ...styles.otpInput,
//                       borderBottomWidth: 1,
//                       borderColor: '#fff',
//                       marginRight: 8,
//                       width: 40,
//                       height: 40,
//                       textAlign: 'center',
//                       color: '#FFF',
//                     }}
//                     keyboardType="numeric"
//                     onChangeText={text => handleOTPChange(text, index)}
//                     value={digit}
//                     maxLength={1}
//                   />
//                 ))}
//               </View>
//               <View style={{gap: 8}}>
//                 <Text style={{...GlobalStyle.f_12, color: '#FFF'}}>
//                   Didn’t you receive any code?
//                 </Text>
//                 <View
//                   style={{
//                     flexDirection: 'row',
//                     justifyContent: 'center',
//                     alignItems: 'center',
//                   }}>
//                   <TouchableOpacity
//                     onPress={() => {
//                       if (!timerRunning) {
//                         if (phoneNumber) {
//                           resendOtp();
//                         }
//                       }
//                     }}>
//                     <Text
//                       style={{
//                         ...GlobalStyle.f_12,
//                         color: '#FFF',
//                         fontWeight: 700,
//                       }}>
//                       Re-send Code
//                     </Text>
//                   </TouchableOpacity>
//                   {timerRunning && (
//                     <Text style={{color: '#E92E4F', fontWeight: 600}}>
//                       {' '}
//                       {`${minutes.toString().padStart(2, '0')}:${seconds
//                         .toString()
//                         .padStart(2, '0')}`}
//                     </Text>
//                   )}
//                 </View>
//               </View>
//             </View>
//             <TouchableOpacity onPress={confirmVerificationCode}>
//               <View style={styles.verifyBtn}>
//                 {loading ? (
//                   <ActivityIndicator size="small" color="#fff" />
//                 ) : (
//                   <Text style={{...GlobalStyle.f_18, color: '#FFF'}}>
//                     Verify & Sign In
//                   </Text>
//                 )}
//               </View>
//             </TouchableOpacity>
//           </View>
//         </ScrollView>
//       </ImageBackground>
//     </View>
//   );
// };
// export default OTP;

// const styles = StyleSheet.create({
//   otp_container: {
//     flex: 1,
//   },
//   Background_container: {
//     width: '100%',
//     height: '100%',
//   },
//   logo: {
//     resizeMode: 'cover',
//     width: 126.818,
//     height: 30,
//   },
//   FormField: {
//     display: 'flex',
//     padding: 16,
//     flexDirection: 'column',
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 16,
//     borderRadius: 8,
//     backgroundColor: 'rgba(159, 159, 159, 0.55)',
//     opacity: 0.7,
//   },
//   otpForm_container: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },

//   otpInput: {
//     // fontSize: 26,
//     // textAlign: 'center',
//     // // opacity: 0.3,
//     // borderBottomColor: '#FFF',
//     // borderBottomWidth: 3,
//     // // borderBottomStyle: 'solid',
//     // display: 'flex',
//     // height: 60,
//     // // paddingVerticle: 20,
//     // // paddingHorizontal: 26,
//     // // padding: 20px 26px;
//     // flexDirection: 'column',
//     // justifyContent: 'center',
//     // alignItems: 'center',
//     // // gap: 10,
//     // // flex: 1,
//     // backgroundColor: 'transparent',
//     // color: '#fff',
//   },
//   verifyBtn: {
//     display: 'flex',
//     width: 312,
//     height: 44,
//     paddingVerticle: 4,
//     paddingHorizontal: 16,
//     flexDirection: 'column',
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 8,
//     flexShrink: 0,
//     borderRadius: 6,
//     backgroundColor: '#E92E4F',
//   },
//   borderStyleBase: {
//     width: 40,
//     height: 45,
//   },

//   borderStyleHighLighted: {
//     borderColor: '#03DAC6',
//   },

//   underlineStyleBase: {
//     borderWidth: 0,
//     borderBottomWidth: 3,
//     height: 60,
//     marginHorizontal: 4,
//   },

//   underlineStyleHighLighted: {
//     borderColor: '#03DAC6',
//   },
// });
