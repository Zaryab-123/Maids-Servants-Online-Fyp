// import React, { useState, useEffect, useRef } from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   SafeAreaView,
//   Image,
//   Platform,
//   ActivityIndicator,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { launchImageLibrary } from 'react-native-image-picker';
// import NotificationHelper from '../Notification/NotificationHelper';
// import { SERVER_BASE, API_ACCOUNT } from '../../config';

// const FormInput = ({ icon, placeholder, isPassword, secure, toggleSecure, value, onChangeText, keyboardType, isDropdown, isButton, onPress, leftIconColor }) => (
//   <TouchableOpacity
//     activeOpacity={isButton ? 0.7 : 1}
//     onPress={isButton ? onPress : null}
//     style={styles.inputWrapper}
//   >
//     <View style={styles.iconCircle}>
//       <Icon name={icon} size={20} color={leftIconColor || '#333'} />
//     </View>
//     {isDropdown || isButton ? (
//       <Text style={[styles.input, { color: value ? '#333' : '#999', paddingTop: 16 }]}>
//         {value || placeholder}
//       </Text>
//     ) : (
//       <TextInput
//         style={styles.input}
//         placeholder={placeholder}
//         placeholderTextColor="#999"
//         value={value}
//         onChangeText={onChangeText}
//         keyboardType={keyboardType || 'default'}
//         secureTextEntry={isPassword ? secure : false}
//         autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
//       />
//     )}
//     {isPassword && (
//       <TouchableOpacity onPress={toggleSecure} style={styles.eyeIcon}>
//         <Icon name={secure ? 'eye-off' : 'eye'} size={20} color="#333" />
//       </TouchableOpacity>
//     )}
//   </TouchableOpacity>
// );

// const SignupScreen = ({ navigation, route }) => {
//   // Top-level Unconditional Hooks
//   const [role, setRole] = useState('Client');
//   const [step, setStep] = useState(1);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   // Client & Worker fields
//   const [name, setName] = useState('');
//   const [age, setAge] = useState('');
//   const [phone, setPhone] = useState('');
//   const [cnic, setCnic] = useState('');
//   const [salary, setSalary] = useState('');
//   const [email, setEmail] = useState('');
//   const [address, setAddress] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [hasAddedSkills, setHasAddedSkills] = useState(false);
//   const [skillsData, setSkillsData] = useState([]);
//   const [gender, setGender] = useState('Male');
//   const [bio, setBio] = useState('');

//   // Company fields
//   const [companyName, setCompanyName] = useState('');
//   const [licenseNumber, setLicenseNumber] = useState('');

//   const [isLoading, setIsLoading] = useState(false);

//   // ─── LOCATION (NEW) ────────────────────────────────────────────────────────
//   // Holds the pin the user dropped on MapScreen. Required for Client & Worker
//   // signups, and it is sent to the backend as part of the signup form-data.
//   const [pendingLocation, setPendingLocation] = useState(null);

//   // Keeps edit-mode stable even if the navigator replaces route params.
//   const [isEditMode, setIsEditMode] = useState(!!route.params?.isEdit);

//   // Guards so a single map round-trip can never submit twice.
//   const handledLocationRef = useRef(null);
//   // ───────────────────────────────────────────────────────────────────────────

//   useEffect(() => {
//     setIsEditMode(!!route.params?.isEdit);
//   }, [route.params?.isEdit]);

//   useEffect(() => {
//     if (route.params?.isEdit && route.params?.initialData && !hasAddedSkills) {
//       const data = route.params.initialData;
//       const targetRole = route.params.role || 'Worker';

//       setRole(targetRole);
//       setName(data.name || '');
//       setPhone(data.phone || data.phoneNo || '');
//       setAddress(data.location || data.companyAddress || '');
//       setEmail(data.email || '');
//       setBio(data.bio || '');
//       const dbGender = data.gender ? data.gender.toLowerCase() : 'male';
//       setGender(dbGender === 'female' ? 'Female' : 'Male');

//       if (targetRole === 'Worker') {
//         setAge(data.age?.toString() || '');
//         setCnic(data.cnic || '');
//         const rawSalary = data.salary ? data.salary.toString() : '0';
//         setSalary(rawSalary.replace('Not Set', '0'));

//         if (data.rawExperiences) {
//           setSkillsData(data.rawExperiences);
//           setHasAddedSkills(true);
//         }
//       } else if (targetRole === 'Company') {
//         setCompanyName(data.companyName || '');
//         setLicenseNumber(data.licenseNumber || '');
//       }

//       if (data.picture && typeof data.picture === 'string') {
//         setSelectedImage({ uri: data.picture.startsWith('/') ? `${SERVER_BASE}${data.picture}` : data.picture });
//       }
//     }

//     if (route.params?.skillsCompleted) {
//       setHasAddedSkills(true);

//       if (route.params.name !== undefined) setName(route.params.name);
//       if (route.params.age !== undefined) setAge(route.params.age);
//       if (route.params.phone !== undefined) setPhone(route.params.phone);
//       if (route.params.cnic !== undefined) setCnic(route.params.cnic);
//       if (route.params.salary !== undefined) setSalary(route.params.salary);
//       if (route.params.email !== undefined) setEmail(route.params.email);
//       if (route.params.address !== undefined) setAddress(route.params.address);
//       if (route.params.password !== undefined) setPassword(route.params.password);
//       if (route.params.confirmPassword !== undefined) setConfirmPassword(route.params.confirmPassword);
//       if (route.params.selectedImage !== undefined) setSelectedImage(route.params.selectedImage);
//       if (route.params.role !== undefined) setRole(route.params.role);
//       if (route.params.gender !== undefined) setGender(route.params.gender);
//       if (route.params.bio !== undefined) setBio(route.params.bio);

//       if (route.params.experiencesJson) {
//         try {
//           setSkillsData(JSON.parse(route.params.experiencesJson));
//         } catch (e) {
//           console.error(e);
//         }
//       }

//       setStep(2);
//     }
//   }, [route.params]);

//   // ─── Snapshot of everything the signup API needs ───────────────────────────
//   // The map screen is pushed on top of this screen, so the form state is still
//   // alive when we come back. We still ship a snapshot through route params so
//   // the flow keeps working even if the navigator ever unmounts this screen.
//   const buildDraft = () => ({
//     role,
//     step,
//     name,
//     age,
//     phone,
//     cnic,
//     salary,
//     email,
//     address,
//     password,
//     confirmPassword,
//     selectedImage,
//     gender,
//     bio,
//     companyName,
//     licenseNumber,
//     hasAddedSkills,
//     skillsData,
//   });

//   const openMapForLocation = () => {
//     navigation.navigate('MapScreen', {
//       pickLocationForSignup: true,
//       userRole: role,
//       latitude: pendingLocation?.latitude ?? null,
//       longitude: pendingLocation?.longitude ?? null,
//       signupDraft: buildDraft(),
//     });
//   };

//   const goToSkills = () => {
//     navigation.navigate('AddSkills', {
//       ...route.params,
//       name, age, phone, cnic, salary, email, address, password, confirmPassword,
//       role, step, selectedImage, gender, bio,
//       existingExperiences: skillsData
//     });
//   };

//   const pickImage = () => {
//     launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (response) => {
//       if (!response.didCancel && response.assets) {
//         setSelectedImage(response.assets[0]);
//       }
//     });
//   };

//   // ─── ACTUAL SUBMIT ────────────────────────────────────────────────────────
//   // Everything is passed in explicitly (data + location) so this can be called
//   // safely from either the button or the "returned from map" effect below.
//   const performSignup = async (data, location) => {
//     const {
//       role: dataRole, name: dName, age: dAge, phone: dPhone, cnic: dCnic, salary: dSalary,
//       email: dEmail, address: dAddress, password: dPassword, confirmPassword: dConfirmPassword,
//       selectedImage: dImage, gender: dGender, bio: dBio, companyName: dCompanyName,
//       licenseNumber: dLicenseNumber, skillsData: dSkills
//     } = data;

//     if (dataRole === 'Company') {
//       if (!dCompanyName || !dEmail || !dPhone || !dLicenseNumber || !dAddress) {
//         NotificationHelper.showError("Please fill out all company details.");
//         return;
//       }
//     } else {
//       if (!dName || !dPhone || !dAddress || !dEmail) {
//         NotificationHelper.showError("Please fill out all fundamental profile details.");
//         return;
//       }
//     }

//     if (!isEditMode && !dPassword) {
//       NotificationHelper.showError("Password field is required.");
//       return;
//     }

//     if (dPassword !== dConfirmPassword) {
//       NotificationHelper.showError("Passwords do not match.");
//       return;
//     }

//     if (!dImage && (dataRole === 'Client' || dataRole === 'Worker')) {
//       NotificationHelper.showError("Please upload a profile picture.");
//       return;
//     }

//     if (dataRole === 'Worker' && dSkills.length === 0) {
//       NotificationHelper.showError("Please add at least one primary skill to proceed.");
//       return;
//     }

//     // Location is mandatory for Client & Worker signups (not for edits/company)
//     const needsLocation = !isEditMode && (dataRole === 'Client' || dataRole === 'Worker');
//     if (needsLocation && !location) {
//       NotificationHelper.showError("Please pin your location on the map to continue.");
//       openMapForLocation();
//       return;
//     }

//     const API_BASE_URL = API_ACCOUNT;
//     let endpoint = '';
//     if (dataRole === 'Company') {
//       endpoint = isEditMode ? 'UpdateCompany' : 'SignupCompany';
//     } else if (dataRole === 'Client') {
//       endpoint = isEditMode ? 'UpdateClient' : 'SignupClient';
//     } else {
//       endpoint = isEditMode ? 'UpdateWorker' : 'SignupWorker';
//     }

//     const url = `${API_BASE_URL}/${endpoint}`;
//     const formData = new FormData();

//     if (isEditMode) {
//       const initialId = route.params?.initialData?.id;
//       if (!initialId) {
//         NotificationHelper.showError("Session error: Missing profile tracking metadata.");
//         return;
//       }
//       formData.append(
//         dataRole === 'Company' ? 'CompanyID' : (dataRole === 'Client' ? 'ClientId' : 'WorkerId'),
//         initialId
//       );
//     }

//     if (dataRole === 'Company') {
//       formData.append('CompanyName', dCompanyName);
//       formData.append('PhoneNo', dPhone);
//       formData.append('CompanyAddress', dAddress);
//       formData.append('LicenseNumber', dLicenseNumber);
//       formData.append('Email', dEmail);
//       formData.append('Password', dPassword || "");

//       if (dImage && dImage.uri && !dImage.uri.startsWith('http')) {
//         formData.append('LogoFile', {
//           uri: Platform.OS === 'android' ? dImage.uri : dImage.uri.replace('file://', ''),
//           type: dImage.type || 'image/jpeg',
//           name: dImage.fileName || 'logo.jpg',
//         });
//       }
//     } else {
//       formData.append('Name', dName);
//       formData.append('Phone', dPhone);
//       formData.append('Address', dAddress);
//       formData.append('Password', dPassword || "");
//       formData.append('Email', dEmail);

//       if (dataRole === 'Worker') {
//         formData.append('Cnic', dCnic);
//         formData.append('Salary', dSalary || "0");
//         formData.append('Age', dAge || "0");
//         formData.append('Gender', dGender);
//         formData.append('Bio', dBio);
//         formData.append('experiencesJson', JSON.stringify(dSkills));
//       }

//       if (dImage && dImage.uri && !dImage.uri.startsWith('http')) {
//         formData.append('PictureFile', {
//           uri: Platform.OS === 'android' ? dImage.uri : dImage.uri.replace('file://', ''),
//           type: dImage.type || 'image/jpeg',
//           name: dImage.fileName || 'profile.jpg',
//         });
//       }

//       // ─── LOCATION SENT WITH THE SIGNUP REQUEST (NEW) ───────────────────────
//       // Client.Latitude/Longitude (double?) and Worker.Latitude/Longitude
//       // (decimal?) bind straight from these form fields on SignupClient /
//       // SignupWorker, so no extra API call and no backend change is needed.
//       // toFixed() guarantees a dot decimal separator regardless of device locale.
//       if (needsLocation && location) {
//         formData.append('Latitude', Number(location.latitude).toFixed(6));
//         formData.append('Longitude', Number(location.longitude).toFixed(6));
//       }
//       // ───────────────────────────────────────────────────────────────────────
//     }

//     setIsLoading(true);
//     try {
//       const response = await fetch(url, {
//         method: 'POST',
//         headers: { 'Accept': 'application/json' },
//         body: formData,
//       });

//       const result = await response.json();

//       if (response.ok) {
//         // Forget the pin so a later fresh signup on this screen starts clean.
//         setPendingLocation(null);
//         handledLocationRef.current = null;

//         NotificationHelper.showSuccess(result.message || "Operation completed successfully!");
//         setTimeout(() => {
//           if (isEditMode) {
//             navigation.navigate(role === 'Worker' ? 'WorkerDashboardScreen' : 'UserDashboardScreen');
//           } else {
//             navigation.replace('Login');
//           }
//         }, 1200);
//       } else {
//         NotificationHelper.showError(result.message || "Something went wrong during data validation.");
//       }
//     } catch (error) {
//       console.error("Auth Action Error:", error);
//       NotificationHelper.showError("Cannot reach backend server.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // ─── BUTTON HANDLER ───────────────────────────────────────────────────────
//   // Validates first; if a Client/Worker has no pin yet, sends them to the map
//   // (carrying the whole form) and the submit happens on the way back.
//   const handleSignup = () => {
//     const data = buildDraft();

//     if (data.role === 'Company') {
//       if (!companyName || !email || !phone || !licenseNumber || !address) {
//         NotificationHelper.showError("Please fill out all company details.");
//         return;
//       }
//     } else if (!name || !phone || !address || !email) {
//       NotificationHelper.showError("Please fill out all fundamental profile details.");
//       return;
//     }

//     if (!isEditMode && !password) {
//       NotificationHelper.showError("Password field is required.");
//       return;
//     }

//     if (password !== confirmPassword) {
//       NotificationHelper.showError("Passwords do not match.");
//       return;
//     }

//     if (!selectedImage && (role === 'Client' || role === 'Worker')) {
//       NotificationHelper.showError("Please upload a profile picture.");
//       return;
//     }

//     if (role === 'Worker' && skillsData.length === 0) {
//       NotificationHelper.showError("Please add at least one primary skill to proceed.");
//       return;
//     }

//     // Mandatory location step: Client & Worker only, and never while editing.
//     if (!isEditMode && (role === 'Client' || role === 'Worker') && !pendingLocation) {
//       openMapForLocation();
//       return;
//     }

//     performSignup(data, pendingLocation);
//   };

//   // ─── RETURN FROM THE MAP ──────────────────────────────────────────────────
//   // MapScreen hands the pin back through route params. We submit exactly once
//   // per pin (guarded by pickedAt) and we submit with the params we were given,
//   // so this never depends on state-update timing.
//   useEffect(() => {
//     const params = route.params || {};
//     const picked = params.signupLocation;

//     if (!picked || typeof picked.latitude !== 'number' || typeof picked.longitude !== 'number') return;
//     if (handledLocationRef.current === picked.pickedAt) return;

//     handledLocationRef.current = picked.pickedAt;
//     setPendingLocation(picked);

//     // Restore the form from the snapshot the map echoed back, so the screen is
//     // correct even if it was remounted while the map was open.
//     const draft = params.signupDraft;
//     if (draft) {
//       if (draft.role !== undefined) setRole(draft.role);
//       if (draft.step !== undefined) setStep(draft.step);
//       if (draft.name !== undefined) setName(draft.name);
//       if (draft.age !== undefined) setAge(draft.age);
//       if (draft.phone !== undefined) setPhone(draft.phone);
//       if (draft.cnic !== undefined) setCnic(draft.cnic);
//       if (draft.salary !== undefined) setSalary(draft.salary);
//       if (draft.email !== undefined) setEmail(draft.email);
//       if (draft.address !== undefined) setAddress(draft.address);
//       if (draft.password !== undefined) setPassword(draft.password);
//       if (draft.confirmPassword !== undefined) setConfirmPassword(draft.confirmPassword);
//       if (draft.selectedImage !== undefined) setSelectedImage(draft.selectedImage);
//       if (draft.gender !== undefined) setGender(draft.gender);
//       if (draft.bio !== undefined) setBio(draft.bio);
//       if (draft.companyName !== undefined) setCompanyName(draft.companyName);
//       if (draft.licenseNumber !== undefined) setLicenseNumber(draft.licenseNumber);
//       if (draft.hasAddedSkills !== undefined) setHasAddedSkills(draft.hasAddedSkills);
//       if (draft.skillsData !== undefined) setSkillsData(draft.skillsData);

//       if (!route.params?.isEdit) {
//         performSignup(draft, picked);
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [route.params]);

//   // Small reusable UI block that shows the captured pin + a Change action.
//   const renderLocationRow = () => {
//     if (isEditMode || (role !== 'Client' && role !== 'Worker')) return null;

//     return (
//       <View style={styles.locationCard}>
//         <View style={styles.iconCircle}>
//           <Icon
//             name={pendingLocation ? 'map-marker-check' : 'map-marker-question-outline'}
//             size={20}
//             color={pendingLocation ? '#008000' : '#999'}
//           />
//         </View>
//         <View style={{ flex: 1 }}>
//           <Text style={styles.locationTitle}>
//             {pendingLocation ? 'Location Pinned' : 'Location Required'}
//           </Text>
//           <Text style={styles.locationSub}>
//             {pendingLocation
//               ? `${Number(pendingLocation.latitude).toFixed(5)}, ${Number(pendingLocation.longitude).toFixed(5)}`
//               : 'Drop a pin on the map after tapping the button below'}
//           </Text>
//         </View>
//         {pendingLocation && (
//           <TouchableOpacity onPress={openMapForLocation}>
//             <Text style={styles.locationChange}>Change</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()} style={styles.backArrow}>
//           <Icon name="arrow-left" size={24} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>{isEditMode ? 'Edit Profile' : 'Create Account'}</Text>
//         <Image source={require('../../images/logo.png')} style={styles.headerLogo} resizeMode="contain" />
//       </View>

//       <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
//         {!isEditMode && (
//           <>
//             <Text style={styles.sectionLabel}>SELECT ROLE</Text>
//             <View style={styles.roleGrid}>
//               <TouchableOpacity style={[styles.roleButton, role === 'Client' && styles.activeRole]} onPress={() => { setRole('Client'); setStep(1); }}>
//                 <Icon name="account-outline" size={20} color={role === 'Client' ? "#1E64D3" : "#333"} />
//                 <Text style={[styles.roleText, role === 'Client' && styles.activeRoleText]}>Client</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.roleButton, role === 'Worker' && styles.activeRole]} onPress={() => { setRole('Worker'); setStep(1); }}>
//                 <Icon name="account-group-outline" size={20} color={role === 'Worker' ? "#1E64D3" : "#333"} />
//                 <Text style={[styles.roleText, role === 'Worker' && styles.activeRoleText]}>Worker</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.roleButton, role === 'Company' && styles.activeRole]} onPress={() => { setRole('Company'); setStep(1); }}>
//                 <Icon name="domain" size={20} color={role === 'Company' ? "#1E64D3" : "#333"} />
//                 <Text style={[styles.roleText, role === 'Company' && styles.activeRoleText]}>Company</Text>
//               </TouchableOpacity>
//             </View>
//           </>
//         )}

//         {/* COMPANY SIGNUP FORM */}
//         {role === 'Company' && (
//           <>
//             <TouchableOpacity style={styles.avatarPicker} onPress={pickImage}>
//               {selectedImage ? (
//                 <Image source={{ uri: selectedImage.uri }} style={styles.fullAvatar} />
//               ) : (
//                 <View style={styles.imagePlaceholder}>
//                   <Icon name="domain" size={32} color="#999" />
//                   <Text style={{ fontSize: 10, color: '#999', marginTop: 4 }}>Upload Company Logo</Text>
//                 </View>
//               )}
//             </TouchableOpacity>

//             <FormInput icon="domain" placeholder="Company Name" value={companyName} onChangeText={setCompanyName} />
//             <FormInput icon="email-outline" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
//             <FormInput icon="phone-outline" placeholder="Phone no" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
//             <FormInput icon="card-account-details-outline" placeholder="License/Registration Number" value={licenseNumber} onChangeText={setLicenseNumber} />
//             <FormInput icon="map-marker-outline" placeholder="Company Address" value={address} onChangeText={setAddress} />

//             <FormInput icon="lock-outline" placeholder="Password" isPassword secure={!showPassword} toggleSecure={() => setShowPassword(!showPassword)} value={password} onChangeText={setPassword} />
//             <FormInput icon="lock-outline" placeholder="Confirm Password" isPassword secure={!showConfirmPassword} toggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} value={confirmPassword} onChangeText={setConfirmPassword} />

//             <View style={styles.buttonRow}>
//               <TouchableOpacity style={[styles.actionButton, styles.blueBtn]} onPress={() => navigation.goBack()}>
//                 <Text style={styles.buttonText}>Back</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.actionButton, styles.blueBtn]} onPress={() => handleSignup()}>
//                 {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{isEditMode ? 'Update' : 'Signup'}</Text>}
//               </TouchableOpacity>
//             </View>
//           </>
//         )}

//         {/* CLIENT & WORKER STEP 1 FORM */}
//         {((role === 'Client') || (role === 'Worker' && step === 1)) && (
//           <>
//             <TouchableOpacity style={styles.avatarPicker} onPress={pickImage}>
//               {selectedImage ? <Image source={{ uri: selectedImage.uri }} style={styles.fullAvatar} /> : (
//                 <View style={styles.imagePlaceholder}>
//                   <Icon name="camera-plus-outline" size={30} color="#999" />
//                   <Text style={{ fontSize: 10, color: '#999' }}>Upload Photo</Text>
//                 </View>
//               )}
//             </TouchableOpacity>
//             <FormInput icon="account-outline" placeholder="Full Name" value={name} onChangeText={setName} />
//             {role === 'Worker' && (
//               <>
//                 <FormInput icon="card-bulleted-outline" placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
//                 <FormInput icon="card-account-details-outline" placeholder="CNIC" value={cnic} onChangeText={setCnic} keyboardType="numeric" />
//                 <FormInput icon="currency-usd" placeholder="Salary" value={salary} onChangeText={setSalary} keyboardType="numeric" />
//               </>
//             )}
//             <FormInput icon="phone-outline" placeholder="Phone no" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
//             {role === 'Worker' && (
//               <FormInput icon="map-marker-outline" placeholder="Address" value={address} onChangeText={setAddress} />
//             )}
//             {role === 'Client' && (
//               <>
//                 <FormInput icon="email-outline" placeholder="Email" value={email} onChangeText={setEmail} />
//                 <FormInput icon="home-outline" placeholder="Address" value={address} onChangeText={setAddress} />
//                 <FormInput icon="lock-outline" placeholder="Password" isPassword secure={!showPassword} toggleSecure={() => setShowPassword(!showPassword)} value={password} onChangeText={setPassword} />
//                 <FormInput icon="lock-outline" placeholder="Confirm Password" isPassword secure={!showConfirmPassword} toggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} value={confirmPassword} onChangeText={setConfirmPassword} />
//               </>
//             )}

//             {renderLocationRow()}

//             <View style={styles.buttonRow}>
//               <TouchableOpacity style={[styles.actionButton, styles.blueBtn]} onPress={() => navigation.goBack()}><Text style={styles.buttonText}>Back</Text></TouchableOpacity>
//               <TouchableOpacity style={[styles.actionButton, styles.blueBtn]} onPress={() => role === 'Client' ? handleSignup() : setStep(2)}>
//                 {isLoading ? (
//                   <ActivityIndicator color="#FFF" />
//                 ) : (
//                   <Text style={styles.buttonText}>{role === 'Client' ? (isEditMode ? 'Update' : 'Signup') : 'Next'}</Text>
//                 )}
//               </TouchableOpacity>
//             </View>
//           </>
//         )}

//         {/* WORKER STEP 2 FORM */}
//         {role === 'Worker' && step === 2 && (
//           <>
//             <Text style={styles.sectionLabel}>PROFESSIONAL DESCRIPTION</Text>
//             <View style={[styles.inputWrapper, { height: 75, alignItems: 'flex-start', paddingTop: 10 }]}>
//               <View style={styles.iconCircle}>
//                 <Icon name="text-account" size={20} color="#333" />
//               </View>
//               <TextInput
//                 style={[styles.input, { height: 55, textAlignVertical: 'top' }]}
//                 placeholder="Briefly describe your work experience and skills..."
//                 placeholderTextColor="#999"
//                 multiline={true}
//                 numberOfLines={2}
//                 value={bio}
//                 onChangeText={setBio}
//               />
//             </View>

//             <FormInput icon="email-outline" placeholder="Email" value={email} onChangeText={setEmail} />

//             <FormInput
//               icon={skillsData.length > 0 ? "check-circle" : "plus-circle-outline"}
//               leftIconColor={skillsData.length > 0 ? "#008000" : "#1E64D3"}
//               placeholder="Add Skills"
//               isButton={true}
//               value={skillsData.length > 0 ? `${skillsData.length} Skills Added` : ""}
//               onPress={goToSkills}
//             />

//             <Text style={styles.sectionLabel}>SELECT GENDER</Text>
//             <View style={styles.genderContainer}>
//               <TouchableOpacity
//                 style={[styles.genderChip, gender === 'Male' && styles.activeGenderChip]}
//                 onPress={() => setGender('Male')}
//               >
//                 <Icon name="gender-male" size={20} color={gender === 'Male' ? "#FFF" : "#333"} />
//                 <Text style={[styles.genderText, gender === 'Male' && styles.activeGenderText]}>Male</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.genderChip, gender === 'Female' && styles.activeGenderChip]}
//                 onPress={() => setGender('Female')}
//               >
//                 <Icon name="gender-female" size={20} color={gender === 'Female' ? "#FFF" : "#333"} />
//                 <Text style={[styles.genderText, gender === 'Female' && styles.activeGenderText]}>Female</Text>
//               </TouchableOpacity>
//             </View>

//             <FormInput icon="lock-outline" placeholder={isEditMode ? "New Password (Optional)" : "Password"} isPassword secure={!showPassword} toggleSecure={() => setShowPassword(!showPassword)} value={password} onChangeText={setPassword} />
//             <FormInput icon="lock-outline" placeholder={isEditMode ? "Confirm New Password" : "Confirm Password"} isPassword secure={!showConfirmPassword} toggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} value={confirmPassword} onChangeText={setConfirmPassword} />

//             {renderLocationRow()}

//             <View style={styles.buttonRow}>
//               <TouchableOpacity style={[styles.actionButton, styles.blueBtn]} onPress={() => setStep(1)}><Text style={styles.buttonText}>Back</Text></TouchableOpacity>
//               <TouchableOpacity style={[styles.actionButton, styles.blueBtn]} onPress={() => handleSignup()}>
//                 {isLoading ? (
//                   <ActivityIndicator color="#FFF" />
//                 ) : (
//                   <Text style={styles.buttonText}>{isEditMode ? 'Update Profile' : 'Submit'}</Text>
//                 )}
//               </TouchableOpacity>
//             </View>
//           </>
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#FFF' },
//   header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, elevation: 4, backgroundColor: '#FFF' },
//   backArrow: { padding: 8, backgroundColor: '#F0F0F0', borderRadius: 20 },
//   headerTitle: { fontSize: 22, fontWeight: 'bold' },
//   headerLogo: { width: 40, height: 40 },
//   scrollContent: { padding: 20, paddingBottom: 100 },
//   sectionLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
//   roleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
//   roleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '31%', height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', elevation: 2, backgroundColor: '#F9F9F9', marginBottom: 10 },
//   activeRole: { backgroundColor: '#E0DADA', borderColor: '#1E64D3' },
//   roleText: { marginLeft: 8, fontWeight: '600', fontSize: 14, color: '#333' },
//   activeRoleText: { color: '#1E64D3', fontWeight: 'bold' },
//   avatarPicker: { alignSelf: 'center', width: 110, height: 110, borderRadius: 55, backgroundColor: '#F5F5F5', marginBottom: 20, elevation: 4, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
//   fullAvatar: { width: '100%', height: '100%' },
//   imagePlaceholder: { alignItems: 'center' },
//   inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, height: 55, marginBottom: 15, paddingHorizontal: 15, elevation: 4 },
//   iconCircle: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
//   input: { flex: 1, fontSize: 16 },
//   buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
//   actionButton: { width: '47%', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 5 },
//   blueBtn: { backgroundColor: '#1E64D3' },
//   buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
//   eyeIcon: { backgroundColor: '#EEE', borderRadius: 15, padding: 4 },
//   genderContainer: { flexDirection: 'row', marginBottom: 15 },
//   genderChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#EEE' },
//   activeGenderChip: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
//   genderText: { marginLeft: 8, fontWeight: 'bold', color: '#333' },
//   activeGenderText: { color: '#FFF' },
//   // ─── location card (new) ───
//   locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F8FF', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 12, marginBottom: 5, borderWidth: 1, borderColor: '#D6E7FF' },
//   locationTitle: { fontSize: 14, fontWeight: 'bold', color: '#123B7A' },
//   locationSub: { fontSize: 12, color: '#5B6B7F', marginTop: 2 },
//   locationChange: { fontSize: 13, fontWeight: 'bold', color: '#1E64D3', marginLeft: 8 },
// });

// export default SignupScreen;


import React, { useState, useEffect, useRef } from 'react';

import Icon from '@/web/Icon';
import { launchImageLibrary } from '@/web/ImagePicker';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE, API_ACCOUNT } from '../../config';
import { Platform, RESIZE, Spinner, StyleSheet, TextBox, changeText, imgSrc, press, sx, tin } from '@/web';
import __img_logo_png from '../../images/logo.png';
import defaultUser from '../../images/default-user.png';


// ─── Design tokens (prototype) ────────────────────────────────────────────────
const BG = '#F6F9FF';
const SURFACE = '#FFFFFF';
const BLUE = '#1E64D3';
const INK = '#0E1B4D';
const MUTED = '#9BA9C0';
const SUBTLE = '#7C8CA6';
const LINE = '#E6EDF9';
const SOFT_BLUE = '#EAF2FF';
const SOFT_BLUE_BORDER = '#D8E6FF';

const LOGO_MARK = __img_logo_png;

const resolveProfileImage = (rawValue) => {
  if (!rawValue || typeof rawValue !== 'string') return null;
  const value = rawValue.trim();
  if (!value) return null;
  if (value.includes('company_default') || value.includes('default-user') || value.includes('/Images/default') || value.includes('default.jpg')) {
    return null;
  }
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('blob:')) return value;
  return value.startsWith('/') ? `${SERVER_BASE}${value}` : value;
};

// The signup POST is a multipart upload (profile photo + JSON). Nothing used to
// bound it, so when the backend never answered the button stayed on the spinner
// forever with no reason shown. The request is now raced against this ceiling and
// the socket is aborted when it fires.
const SIGNUP_TIMEOUT_MS = 45000;

const ROLES = [
  { key: 'Client', label: 'Client', icon: 'account-outline' },
  { key: 'Worker', label: 'Worker', icon: 'broom' },
  { key: 'Company', label: 'Company', icon: 'domain' },
];

// ─── Reusable card-styled input (prototype look) ──────────────────────────────
const Field = ({
  icon, placeholder, value, onChangeText, keyboardType, autoCapitalize,
  secure, onToggleSecure, multiline, style, iconColor,
}) => (
  <div className="v" style={sx([styles.field, style])}>
    <Icon name={icon} size={18} color={iconColor || MUTED} style={styles.fieldIcon} />
    <TextBox className="input" {...tin({ keyboardType: keyboardType || 'default', autoCapitalize: autoCapitalize || 'sentences', secureTextEntry: !!secure })}
      style={{ ...sx([styles.fieldInput, multiline && styles.fieldInputMultiline]), '--ph': MUTED }}
      placeholder={placeholder}
      
      value={(value) ?? ''}
      onChange={changeText(onChangeText)}
      
      
      
      multiline={!!multiline}
      
    />
    {onToggleSecure && (
      <button className="v btn" type="button" onClick={press(onToggleSecure)}  style={sx(styles.eyeBtn)}>
        <Icon name={secure ? 'eye-off-outline' : 'eye-outline'} size={19} color={MUTED} />
      </button>
    )}
  </div>
);

const SignupScreen = ({ navigation, route }) => {
  // ─── state (unchanged behaviour) ────────────────────────────────────────────
  const [role, setRole] = useState('Client');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Client & Worker fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [salary, setSalary] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [hasAddedSkills, setHasAddedSkills] = useState(false);
  const [skillsData, setSkillsData] = useState([]);
  const [gender, setGender] = useState('Male');
  const [bio, setBio] = useState('');
  // Habits: the list comes from the API (dbo.Habits) — the worker only ticks
  // checkboxes, so the wording stays identical to the client-side filter options.
  const [habitsCatalog, setHabitsCatalog] = useState([]);
  const [selectedHabitIds, setSelectedHabitIds] = useState([]);
  const [isLoadingHabits, setIsLoadingHabits] = useState(false);
  // True once the worker's current habits have been read from GetWorkerDetail.
  // While editing, habitsJson is only sent when this is true — otherwise an
  // empty list would silently wipe the worker's habits.
  const [habitsPrefilled, setHabitsPrefilled] = useState(false);

  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  // ─── LOCATION ───────────────────────────────────────────────────────────────
  // Pin dropped on MapScreen. Required for Client & Worker signups and sent to
  // the backend inside the signup form-data (no backend change needed).
  const [pendingLocation, setPendingLocation] = useState(null);

  // Keeps edit-mode stable even if the navigator replaces route params.
  const [isEditMode, setIsEditMode] = useState(!!route.params?.isEdit);

  // Guards so a single map round-trip can never submit twice.
  const handledLocationRef = useRef(null);
  // Guards against a double tap on Submit racing the auto-submit after the map.
  const submittingRef = useRef(false);

  useEffect(() => {
    setIsEditMode(!!route.params?.isEdit);
  }, [route.params?.isEdit]);

  // Restores edit-mode data + the Add-Skills round trip (unchanged behaviour)
  // ─── HABITS: the checkbox list ──────────────────────────────────────────────
  useEffect(() => {
    if (role !== 'Worker') return;

    let cancelled = false;
    (async () => {
      try {
        setIsLoadingHabits(true);
        // [AllowAnonymous] on the server so signup can read it before a token exists
        const response = await fetch(`${SERVER_BASE}/api/Habits/GetHabits`);
        if (!response.ok) return;
        const list = await response.json();
        if (!cancelled) setHabitsCatalog(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error('Habits load failed:', error?.message);
      } finally {
        if (!cancelled) setIsLoadingHabits(false);
      }
    })();

    return () => { cancelled = true; };
  }, [role]);

  const toggleHabit = (habitId) => {
    setSelectedHabitIds((prev) =>
      prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]
    );
  };

  useEffect(() => {
    if (route.params?.isEdit && route.params?.initialData && !hasAddedSkills) {
      const data = route.params.initialData;
      const targetRole = route.params.role || 'Worker';

      setRole(targetRole);
      setName(data.name || '');
      setPhone(data.phone || data.phoneNo || '');
      setAddress(data.location || data.companyAddress || '');
      setEmail(data.email || '');
      setBio(data.bio || '');
      const dbGender = data.gender ? data.gender.toLowerCase() : 'male';
      setGender(dbGender === 'female' ? 'Female' : 'Male');

      if (targetRole === 'Worker') {
        setAge(data.age?.toString() || '');
        setCnic(data.cnic || '');
        const rawSalary = data.salary ? data.salary.toString() : '0';
        setSalary(rawSalary.replace('Not Set', '0'));

        if (data.rawExperiences) {
          setSkillsData(data.rawExperiences);
          setHasAddedSkills(true);
        }

        // Pre-tick the habits already on the profile
        // (GetWorkerDetail returns habits: [{ id, name }]).
        if (Array.isArray(data.habits)) {
          setSelectedHabitIds(
            data.habits.map((h) => h.id ?? h.habitId).filter((id) => !!id)
          );
        }
        setHabitsPrefilled(true);
      } else if (targetRole === 'Company') {
        setCompanyName(data.companyName || '');
        setLicenseNumber(data.licenseNumber || '');
      }

      const resolvedPicture = resolveProfileImage(data.picture);
      if (resolvedPicture) {
        setSelectedImage({ uri: resolvedPicture });
      } else {
        setSelectedImage(null);
      }
    }

    if (route.params?.skillsCompleted) {
      setHasAddedSkills(true);

      if (route.params.name !== undefined) setName(route.params.name);
      if (route.params.age !== undefined) setAge(route.params.age);
      if (route.params.phone !== undefined) setPhone(route.params.phone);
      if (route.params.cnic !== undefined) setCnic(route.params.cnic);
      if (route.params.salary !== undefined) setSalary(route.params.salary);
      if (route.params.email !== undefined) setEmail(route.params.email);
      if (route.params.address !== undefined) setAddress(route.params.address);
      if (route.params.password !== undefined) setPassword(route.params.password);
      if (route.params.confirmPassword !== undefined) setConfirmPassword(route.params.confirmPassword);
      if (route.params.selectedImage !== undefined) setSelectedImage(route.params.selectedImage);
      if (route.params.role !== undefined) setRole(route.params.role);
      if (route.params.gender !== undefined) setGender(route.params.gender);
      if (route.params.bio !== undefined) setBio(route.params.bio);
      if (Array.isArray(route.params.habits)) setSelectedHabitIds(route.params.habits);

      if (route.params.experiencesJson) {
        try {
          setSkillsData(JSON.parse(route.params.experiencesJson));
        } catch (e) {
          console.error(e);
        }
      }

      // Come back to the step the worker left from (AddSkills is only reachable
      // from step 2) — never step 1. AddSkills used to hand back a STALE draft
      // from an earlier map trip, whose values overwrote the freshly typed
      // bio / email / salary; the draft is now taken on the way out, so it
      // matches what was on screen.
      const backDraft = route.params.signupDraft;
      const backStep = Number(backDraft?.step);
      setStep(Number.isFinite(backStep) && backStep >= 2 ? backStep : 2);

      // Consume it: a leftover draft/step in the route params is exactly what
      // could re-apply later and bounce the form back to step 1.
      navigation.setParams({
        skillsCompleted: undefined,
        experiencesJson: undefined,
        categoryId: undefined,
        signupDraft: undefined,
      });
    }
  }, [route.params]);

  // Snapshot of everything the signup API needs (survives the MapScreen trip)
  const buildDraft = () => ({
    role,
    step,
    name,
    age,
    phone,
    cnic,
    salary,
    email,
    address,
    password,
    confirmPassword,
    selectedImage,
    gender,
    bio,
    companyName,
    licenseNumber,
    hasAddedSkills,
    skillsData,
    // habits survive both the AddSkills trip and the MapScreen trip
    habits: selectedHabitIds,
  });

  const openMapForLocation = () => {
    navigation.navigate('MapScreen', {
      pickLocationForSignup: true,
      userRole: role,
      latitude: pendingLocation?.latitude ?? null,
      longitude: pendingLocation?.longitude ?? null,
      signupDraft: buildDraft(),
    });
  };

  const goToSkills = () => {
    navigation.navigate('AddSkills', {
      ...route.params,
      name, age, phone, cnic, salary, email, address, password, confirmPassword,
      role, step, selectedImage, gender, bio,
      habits: selectedHabitIds,
      existingExperiences: skillsData,
      // A stale map payload echoed through AddSkills would re-arm the map-return
      // effect on the way back, so strip it here.
      signupLocation: undefined,
      // Fresh snapshot taken the moment we leave the form — AddSkills hands it
      // back, which is what lets step 2 come back with every field still filled.
      signupDraft: buildDraft()
    });
  };

  const pickImage = () => {
    // maxWidth / maxHeight are the options that actually resize on Android —
    // `quality` on its own is ignored there, so this used to send the full
    // camera JPEG (5–10 MB) with the signup request, which is exactly the kind
    // of body that stalls on a phone/LAN link and leaves the button spinning.
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8, maxWidth: 1080, maxHeight: 1080 },
      (response) => {
        if (!response.didCancel && response.assets) {
          const asset = response.assets[0];
          const width = asset && typeof asset.width === 'number' ? asset.width : 'unknown';
          const height = asset && typeof asset.height === 'number' ? asset.height : 'unknown';
          console.log('[signup] photo picked:', {
            sizeKB: asset && asset.fileSize ? Math.round(asset.fileSize / 1024) : 'unknown',
            type: asset && asset.type,
            width,
            height,
          });
          setSelectedImage(asset);
        }
      }
    );
  };

  // ─── ACTUAL SUBMIT ──────────────────────────────────────────────────────────
  const performSignup = async (data, location) => {
    if (submittingRef.current) {
      console.log('[signup] duplicate submit ignored — a request is already in flight');
      return;
    }
    submittingRef.current = true;

    const {
      role: dataRole, name: dName, age: dAge, phone: dPhone, cnic: dCnic, salary: dSalary,
      email: dEmail, address: dAddress, password: dPassword, confirmPassword: dConfirmPassword,
      selectedImage: dImage, gender: dGender, bio: dBio, companyName: dCompanyName,
      licenseNumber: dLicenseNumber, skillsData: dSkills, habits: dHabitsRaw
    } = data;

    // Ticked master-list habit ids, e.g. [1, 10, 17]
    const dHabits = Array.isArray(dHabitsRaw) ? dHabitsRaw : [];

    if (dataRole === 'Company') {
      if (!dCompanyName || !dEmail || !dPhone || !dLicenseNumber || !dAddress) {
        NotificationHelper.showError("Please fill out all company details.");
        submittingRef.current = false;
        return;
      }
    } else {
      if (!dName || !dPhone || !dAddress || !dEmail) {
        NotificationHelper.showError("Please fill out all fundamental profile details.");
        submittingRef.current = false;
        return;
      }
    }

    if (!isEditMode && !dPassword) {
      NotificationHelper.showError("Password field is required.");
      submittingRef.current = false;
      return;
    }

    if (dPassword !== dConfirmPassword) {
      NotificationHelper.showError("Passwords do not match.");
      submittingRef.current = false;
      return;
    }

    if (!dImage && (dataRole === 'Client' || dataRole === 'Worker')) {
      NotificationHelper.showError("Please upload a profile picture.");
      submittingRef.current = false;
      return;
    }

    if (dataRole === 'Worker' && dSkills.length === 0) {
      NotificationHelper.showError("Please add at least one primary skill to proceed.");
      submittingRef.current = false;
      return;
    }

    // Location is mandatory for Client & Worker signups (not for edits/company)
    const needsLocation = !isEditMode && (dataRole === 'Client' || dataRole === 'Worker');
    if (needsLocation && !location) {
      NotificationHelper.showError("Please pin your location on the map to continue.");
      submittingRef.current = false;
      openMapForLocation();
      return;
    }

    const API_BASE_URL = API_ACCOUNT;
    let endpoint = '';
    if (dataRole === 'Company') {
      endpoint = isEditMode ? 'UpdateCompany' : 'SignupCompany';
    } else if (dataRole === 'Client') {
      endpoint = isEditMode ? 'UpdateClient' : 'SignupClient';
    } else {
      endpoint = isEditMode ? 'UpdateWorker' : 'SignupWorker';
    }

    const url = `${API_BASE_URL}/${endpoint}`;
    const formData = new FormData();

    if (isEditMode) {
      const initialData = route.params?.initialData || {};
      const sessionId = await AsyncStorage.getItem(
        dataRole === 'Company' ? 'companyId' : (dataRole === 'Client' ? 'clientId' : 'workerId')
      );
      const initialId =
        initialData.id ??
        initialData.companyID ??
        initialData.companyId ??
        initialData.workerId ??
        initialData.clientId ??
        initialData.userId ??
        initialData.UserId ??
        initialData.CompanyID ??
        initialData.WorkerId ??
        initialData.ClientId ??
        sessionId;

      if (!initialId) {
        NotificationHelper.showError("Session error: Missing profile tracking metadata.");
        submittingRef.current = false;
        return;
      }
      formData.append(
        dataRole === 'Company' ? 'CompanyID' : (dataRole === 'Client' ? 'ClientId' : 'WorkerId'),
        String(initialId)
      );
    }

    if (dataRole === 'Company') {
      formData.append('CompanyName', dCompanyName);
      formData.append('PhoneNo', dPhone);
      formData.append('CompanyAddress', dAddress);
      formData.append('LicenseNumber', dLicenseNumber);
      formData.append('Email', dEmail);
      formData.append('Password', dPassword || "");

      if (dImage && dImage.uri && !dImage.uri.startsWith('http')) {
        formData.append('LogoFile', {
          uri: Platform.OS === 'android' ? dImage.uri : dImage.uri.replace('file://', ''),
          type: dImage.type || 'image/jpeg',
          name: dImage.fileName || 'logo.jpg',
        });
      }
    } else {
      formData.append('Name', dName);
      formData.append('Phone', dPhone);
      formData.append('Address', dAddress);
      formData.append('Password', dPassword || "");
      formData.append('Email', dEmail);

      if (dataRole === 'Worker') {
        formData.append('Cnic', dCnic);
        formData.append('Salary', dSalary || "0");
        formData.append('Age', dAge || "0");
        formData.append('Gender', dGender);
        formData.append('Bio', dBio);
        formData.append('experiencesJson', JSON.stringify(dSkills));
        // dHabits = the ticked master-list ids, e.g. [1,10,17].
        // While editing, only send this once the current habits were loaded.
        if (!isEditMode || habitsPrefilled) {
          formData.append('habitsJson', JSON.stringify(dHabits));
        }
      }

      if (dImage && dImage.uri && !dImage.uri.startsWith('http')) {
        formData.append('PictureFile', {
          uri: Platform.OS === 'android' ? dImage.uri : dImage.uri.replace('file://', ''),
          type: dImage.type || 'image/jpeg',
          name: dImage.fileName || 'profile.jpg',
        });
      }

      // ─── LOCATION SENT WITH THE SIGNUP REQUEST ──────────────────────────────
      // Client.Latitude/Longitude (double?) and Worker.Latitude/Longitude
      // (decimal?) bind straight from these form fields on SignupClient /
      // SignupWorker. toFixed() keeps a dot decimal separator on every locale.
      if (needsLocation && location) {
        formData.append('Latitude', Number(location.latitude).toFixed(6));
        formData.append('Longitude', Number(location.longitude).toFixed(6));
      }
    }

    const actionLabel = isEditMode ? 'Update' : 'Signup';
    const photoKB = dImage && dImage.fileSize ? Math.round(dImage.fileSize / 1024) : null;

    // Hard ceiling on the upload: Promise.race guarantees the spinner ALWAYS
    // stops, even if the platform ignores the abort signal.
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timeoutId = null;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        if (controller) controller.abort();
        const err = new Error('Signup request timed out');
        err.isTimeout = true;
        reject(err);
      }, SIGNUP_TIMEOUT_MS);
    });

    setIsLoading(true);
    console.log(`[signup] POST → ${url}`, photoKB ? `(photo ~${photoKB} KB)` : '(no new photo)');
    try {
      const response = await Promise.race([
        fetch(url, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: formData,
          ...(controller ? { signal: controller.signal } : {}),
        }),
        timeoutPromise,
      ]);

      // Read as text first: a 500 from IIS is an HTML page, and calling .json()
      // on it threw, which hid the real server message behind a generic
      // "Cannot reach backend server" toast.
      const rawBody = await response.text();
      let result = {};
      try {
        result = rawBody ? JSON.parse(rawBody) : {};
      } catch (parseError) {
        result = { message: rawBody ? rawBody.slice(0, 180) : '' };
      }

      console.log(`[signup] ← ${response.status}`, result && result.message ? result.message : '');

      if (response.ok) {
        setPendingLocation(null);
        handledLocationRef.current = null;

        NotificationHelper.showSuccess(result.message || "Operation completed successfully!");
        setTimeout(() => {
          if (isEditMode) {
            navigation.navigate(role === 'Worker' ? 'WorkerDashboardScreen' : 'UserDashboardScreen');
          } else {
            navigation.replace('Login');
          }
        }, 1200);
      } else {
        NotificationHelper.showError(
          `${actionLabel} failed (${response.status}): ${result.message || 'unknown server error'}`
        );
      }
    } catch (error) {
      console.error('[signup] request error:', error);
      if (error && (error.isTimeout || error.name === 'AbortError')) {
        NotificationHelper.showError(
          `${actionLabel} timed out after ${Math.round(SIGNUP_TIMEOUT_MS / 1000)}s — the server never answered. ` +
          'Check the backend is running and this phone is on the same Wi-Fi, then tap Sign Up again.'
        );
      } else {
        NotificationHelper.showError(
          `Cannot reach backend server (${(error && error.message) || 'network error'}).`
        );
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  // ─── BUTTON HANDLER ─────────────────────────────────────────────────────────
  const handleSignup = () => {
    const data = buildDraft();

    if (data.role === 'Company') {
      if (!companyName || !email || !phone || !licenseNumber || !address) {
        NotificationHelper.showError("Please fill out all company details.");
        return;
      }
    } else if (!name || !phone || !address || !email) {
      NotificationHelper.showError("Please fill out all fundamental profile details.");
      return;
    }

    if (!isEditMode && !password) {
      NotificationHelper.showError("Password field is required.");
      return;
    }

    if (password !== confirmPassword) {
      NotificationHelper.showError("Passwords do not match.");
      return;
    }

    if (!isEditMode && !selectedImage && (role === 'Client' || role === 'Worker')) {
      NotificationHelper.showError("Please upload a profile picture.");
      return;
    }

    if (role === 'Worker' && skillsData.length === 0) {
      NotificationHelper.showError("Please add at least one primary skill to proceed.");
      return;
    }

    if (role === 'Worker' && !isEditMode && selectedHabitIds.length === 0) {
      NotificationHelper.showError("Please tick at least one habit to proceed.");
      return;
    }

    // Mandatory location step: Client & Worker only, and never while editing.
    if (!isEditMode && (role === 'Client' || role === 'Worker') && !pendingLocation) {
      openMapForLocation();
      return;
    }

    performSignup(data, pendingLocation);
  };

  // ─── RETURN FROM THE MAP ────────────────────────────────────────────────────
  useEffect(() => {
    const params = route.params || {};
    const picked = params.signupLocation;

    if (!picked || typeof picked.latitude !== 'number' || typeof picked.longitude !== 'number') return;
    if (handledLocationRef.current === picked.pickedAt) return;

    handledLocationRef.current = picked.pickedAt;
    setPendingLocation(picked);

    const draft = params.signupDraft;
    if (draft) {
      if (draft.role !== undefined) setRole(draft.role);
      if (draft.step !== undefined) setStep(draft.step);
      if (draft.name !== undefined) setName(draft.name);
      if (draft.age !== undefined) setAge(draft.age);
      if (draft.phone !== undefined) setPhone(draft.phone);
      if (draft.cnic !== undefined) setCnic(draft.cnic);
      if (draft.salary !== undefined) setSalary(draft.salary);
      if (draft.email !== undefined) setEmail(draft.email);
      if (draft.address !== undefined) setAddress(draft.address);
      if (draft.password !== undefined) setPassword(draft.password);
      if (draft.confirmPassword !== undefined) setConfirmPassword(draft.confirmPassword);
      if (draft.selectedImage !== undefined) setSelectedImage(draft.selectedImage);
      if (draft.gender !== undefined) setGender(draft.gender);
      if (draft.bio !== undefined) setBio(draft.bio);
      if (draft.companyName !== undefined) setCompanyName(draft.companyName);
      if (draft.licenseNumber !== undefined) setLicenseNumber(draft.licenseNumber);
      if (draft.hasAddedSkills !== undefined) setHasAddedSkills(draft.hasAddedSkills);
      if (draft.skillsData !== undefined) setSkillsData(draft.skillsData);
      if (Array.isArray(draft.habits)) setSelectedHabitIds(draft.habits);

      // NOTE: returning from the map only fills the pin in — it must NOT fire
      // the signup request. It used to submit right here, which is how a
      // create-account POST could be in flight (button spinning) without the
      // user ever tapping Sign Up on this screen — and it replayed the snapshot
      // taken before the map instead of the live form.
    }

    // Consume the map payload so a stale draft (with its old step number) can
    // never be applied a second time.
    navigation.setParams({ signupLocation: undefined, signupDraft: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params]);

  // ─── header helpers ─────────────────────────────────────────────────────────
  // The worker form is stepped in BOTH modes: Edit Profile used to render only
  // step 1, so bio / email / skills / gender / password (and now habits) were
  // loaded from the API but impossible to see or change.
  const showStepUi = role === 'Worker';
  const headerTitle = isEditMode ? 'Edit Profile' : 'Create Account';

  // Worker signup is 3 steps so no step needs scrolling:
  //   1 Identity (photo, name, age, CNIC, phone, address + map pin)
  //   2 Professional (bio, email, salary, skills, gender)
  //   3 Habits + Security (habits, password)
  const WORKER_TOTAL_STEPS = 3;
  const stepSubtitle = ['Basic Information', 'Professional Details', 'Habits & Security'];
  const headerSubtitle = isEditMode
    ? 'Update your information'
    : (showStepUi
        ? (stepSubtitle[Math.min(Math.max(step, 1), WORKER_TOTAL_STEPS) - 1] || 'Basic Information')
        : 'Basic Information');

  const goBack = () => {
    if (showStepUi && step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  const isLastWorkerStep = !showStepUi || step >= WORKER_TOTAL_STEPS;

  const submitLabel = showStepUi && !isLastWorkerStep
    ? 'Next'
    : isEditMode
      ? (role === 'Company' ? 'Update' : 'Update Profile')
      : 'Sign Up';

  // Per-step gate: catch the obvious gaps before the worker walks three screens
  // deep, then advances. handleSignup() still runs its own full validation at
  // the end (and the API validates again).
  const validateWorkerStep = () => {
    if (step === 1) {
      if (!isEditMode && !selectedImage) return "Please upload a profile picture.";
      if (!name.trim()) return "Please enter your full name.";
      if (!cnic.trim()) return "Please enter your CNIC number.";
      if (!phone.trim()) return "Please enter your phone number.";
      if (!address.trim()) return "Please enter your address or street.";
      return null;
    }
    if (step === 2) {
      if (!email.trim()) return "Please enter your email address.";
      if (!isEditMode && skillsData.length === 0) return "Please add at least one primary skill.";
      return null;
    }
    // step 3 — habits & security
    if (!isEditMode && selectedHabitIds.length === 0) return "Please tick at least one habit.";
    if (!isEditMode && !password) return "Please create a password.";
    if (password && password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const submitHandler = () => {
    if (showStepUi && !isLastWorkerStep) {
      const problem = validateWorkerStep();
      if (problem) {
        NotificationHelper.showError(problem);
        return;
      }
      setStep(step + 1);
      return;
    }
    if (showStepUi) {
      // last step — reuse the same gate, then fall through to the real submit
      const problem = validateWorkerStep();
      if (problem) {
        NotificationHelper.showError(problem);
        return;
      }
    }
    handleSignup();
  };

  // ─── location card ──────────────────────────────────────────────────────────
  const renderLocationCard = () => {
    if (isEditMode || (role !== 'Client' && role !== 'Worker')) return null;
    const pinned = !!pendingLocation;

    return (
      <button className="v btn" type="button"  style={sx(styles.locationCard)} onClick={press(openMapForLocation)}>
        <div className="v" style={sx([styles.locationIcon, pinned && styles.locationIconDone])}>
          <Icon
            name={pinned ? 'map-marker-check-outline' : 'map-marker-radius-outline'}
            size={20}
            color={pinned ? '#FFFFFF' : BLUE}
          />
        </div>
        <div className="v" style={sx(styles.locationTextWrap)}>
          <span className="t" style={sx(styles.locationTitle)}>{pinned ? 'Location Pinned' : 'Location Required'}</span>
          <span className="t" style={sx(styles.locationSub, 1)} >
            {pinned
              ? `${Number(pendingLocation.latitude).toFixed(5)}, ${Number(pendingLocation.longitude).toFixed(5)} — tap to change`
              : 'Tap to pinpoint address on live map'}
          </span>
        </div>
        <div className="v" style={sx([styles.toggleTrack, pinned && styles.toggleTrackOn])}>
          <div className="v" style={sx([styles.toggleKnob, pinned && styles.toggleKnobOn])} />
        </div>
      </button>
    );
  };

  const renderAvatar = () => (
    <div className="v" style={sx(styles.avatarWrap)}>
      <button className="v btn" type="button" style={sx(styles.avatar)} onClick={press(pickImage)} >
        {selectedImage?.uri ? (
          <img className="img" alt="" src={imgSrc({ uri: selectedImage.uri })} style={sx(styles.avatarImg)} />
        ) : (
          <>
            <Icon name="camera-outline" size={22} color={BLUE} />
            <span className="t" style={sx(styles.avatarText)}>Photo</span>
          </>
        )}
      </button>
      <button className="v btn" type="button" style={sx(styles.avatarBadge)} onClick={press(pickImage)} >
        <Icon name="plus" size={14} color="#FFF" />
      </button>
    </div>
  );

  // ─── form bodies ────────────────────────────────────────────────────────────
  const renderBody = () => {
    // COMPANY
    if (role === 'Company') {
      return (
        <>
          {renderAvatar()}
          <Field icon="domain" placeholder="Company Name" value={companyName} onChangeText={setCompanyName} />
          <Field icon="phone-outline" placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field icon="email-outline" placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field icon="home-outline" placeholder="Company Address" value={address} onChangeText={setAddress} />
          <Field icon="card-account-details-outline" placeholder="License / Registration Number" value={licenseNumber} onChangeText={setLicenseNumber} />
          <div className="v" style={sx(styles.splitRow)}>
            <Field
              icon="lock-outline" placeholder="Password" value={password} onChangeText={setPassword}
              secure={!showPassword} onToggleSecure={() => setShowPassword(!showPassword)} style={styles.half}
            />
            <Field
              icon="lock-outline" placeholder="Confirm" value={confirmPassword} onChangeText={setConfirmPassword}
              secure={!showConfirmPassword} onToggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.half}
            />
          </div>
        </>
      );
    }

    // WORKER — STEP 1
    if (role === 'Worker' && step === 1) {
      return (
        <>
          {renderAvatar()}
          <Field icon="account-outline" placeholder="Full Name" value={name} onChangeText={setName} />
          <div className="v" style={sx(styles.splitRow)}>
            <Field
              icon="card-bulleted-outline" placeholder="Age" value={age} onChangeText={setAge}
              keyboardType="numeric" style={styles.half}
            />
            <Field
              icon="card-account-details-outline" placeholder="CNIC" value={cnic} onChangeText={setCnic}
              keyboardType="numeric" style={styles.half}
            />
          </div>
          <Field icon="phone-outline" placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field icon="map-marker-outline" placeholder="Address or Street" value={address} onChangeText={setAddress} />

          <div className="v" style={sx(styles.sectionHeader)}>
            <span className="t" style={sx(styles.sectionLabel)}>SELECT GENDER</span>
          </div>
          <div className="v" style={sx(styles.genderRow)}>
            <button className="v btn" type="button"
              style={sx([styles.genderChip, gender === 'Male' && styles.genderChipActive])}
              onClick={press(() => setGender('Male'))}
              
            >
              <Icon name="gender-male" size={18} color={gender === 'Male' ? '#FFF' : SUBTLE} />
              <span className="t" style={sx([styles.genderText, gender === 'Male' && styles.genderTextActive])}>Male</span>
            </button>
            <button className="v btn" type="button"
              style={sx([styles.genderChip, gender === 'Female' && styles.genderChipActive])}
              onClick={press(() => setGender('Female'))}
              
            >
              <Icon name="gender-female" size={18} color={gender === 'Female' ? '#FFF' : SUBTLE} />
              <span className="t" style={sx([styles.genderText, gender === 'Female' && styles.genderTextActive])}>Female</span>
            </button>
          </div>
        </>
      );
    }

    // WORKER — STEP 2
    if (role === 'Worker' && step === 2) {
      return (
        <>
          <div className="v" style={sx(styles.sectionHeader)}>
            <span className="t" style={sx(styles.sectionLabel)}>PROFESSIONAL DESCRIPTION</span>
          </div>
          <Field
            icon="text-account" placeholder="Briefly describe your work experience and skills..."
            value={bio} onChangeText={setBio} multiline style={styles.bioField}
          />

          <Field
            icon="email-outline" placeholder="Email Address" value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none"
          />

          <Field icon="currency-usd" placeholder="Expected Salary" value={salary} onChangeText={setSalary} keyboardType="numeric" />

          <button className="v btn" type="button" style={sx(styles.field)} onClick={press(goToSkills)} >
            <Icon
              name={skillsData.length > 0 ? 'check-circle-outline' : 'plus-circle-outline'}
              size={18}
              color={skillsData.length > 0 ? '#16A34A' : BLUE}
              style={styles.fieldIcon}
            />
            <span className="t" style={sx([styles.fieldInputText, skillsData.length > 0 && { color: INK }])}>
              {skillsData.length > 0 ? `${skillsData.length} Skills Added` : 'Add Skills'}
            </span>
            <Icon name="chevron-right" size={20} color="#B9C6DB" />
          </button>

        </>
      );
    }

    // WORKER — STEP 3 (habits + password)
    if (role === 'Worker' && step === 3) {
      return (
        <>
          <div className="v" style={sx(styles.sectionHeader)}>
            <span className="t" style={sx(styles.sectionLabel)}>HABITS</span>
            <div className="v" style={sx(styles.requiredBadge)}>
              <span className="t" style={sx(styles.requiredBadgeText)}>Required</span>
            </div>
          </div>
          <span className="t" style={sx(styles.habitsHint)}>
            Shown on your profile, and used by clients when they filter workers.
          </span>

          {isLoadingHabits ? (
            <Spinner color={BLUE} style={styles.habitsLoader} />
          ) : habitsCatalog.length === 0 ? (
            <span className="t" style={sx(styles.habitsHint)}>Could not load the habit list. Check your connection and reopen this screen.</span>
          ) : (
            /* Compact 2-up grid so all habits stay on one screen */
            <div className="v" style={sx(styles.habitsGrid)}>
              {habitsCatalog.map((habit) => {
                const habitId = habit.habitId ?? habit.id;
                const isChecked = selectedHabitIds.includes(habitId);
                return (
                  <button className="v btn" type="button"
                    key={habitId}
                    style={sx([styles.habitCell, isChecked && styles.habitCellActive])}
                    onClick={press(() => toggleHabit(habitId))}
                    
                  >
                    <Icon
                      name={isChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={17}
                      color={isChecked ? BLUE : '#C4CEDE'}
                    />
                    <span className="t"
                      style={sx([styles.habitCellText, isChecked && styles.habitCellTextActive], 2)}
                      
                    >
                      {habit.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <span className="t" style={sx(styles.habitsCount)}>
            {selectedHabitIds.length === 0
              ? 'Tick at least one habit'
              : `${selectedHabitIds.length} habit${selectedHabitIds.length > 1 ? 's' : ''} selected`}
          </span>

          <div className="v" style={sx(styles.sectionHeader)}>
            <span className="t" style={sx(styles.sectionLabel)}>SECURITY</span>
          </div>
          <div className="v" style={sx(styles.splitRow)}>
            <Field
              icon="lock-outline" placeholder={isEditMode ? 'New Password' : 'Password'} value={password} onChangeText={setPassword}
              secure={!showPassword} onToggleSecure={() => setShowPassword(!showPassword)} style={styles.half}
            />
            <Field
              icon="lock-outline" placeholder="Confirm" value={confirmPassword} onChangeText={setConfirmPassword}
              secure={!showConfirmPassword} onToggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.half}
            />
          </div>

          {/* Location last: pinning it is the final act of signup — we send the
              worker to the map, then come straight back here and submit. */}
          {renderLocationCard()}
        </>
      );
    }

    // CLIENT — single page
    return (
      <>
        {renderAvatar()}
        <Field icon="account-outline" placeholder="Full Name" value={name} onChangeText={setName} />
        <Field icon="phone-outline" placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field icon="email-outline" placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field icon="home-outline" placeholder="Address or Street" value={address} onChangeText={setAddress} />
        <div className="v" style={sx(styles.splitRow)}>
          <Field
            icon="lock-outline" placeholder="Password" value={password} onChangeText={setPassword}
            secure={!showPassword} onToggleSecure={() => setShowPassword(!showPassword)} style={styles.half}
          />
          <Field
            icon="lock-outline" placeholder="Confirm" value={confirmPassword} onChangeText={setConfirmPassword}
            secure={!showConfirmPassword} onToggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.half}
          />
        </div>
        {renderLocationCard()}
      </>
    );
  };

  return (
    <div className="v screen" style={sx(styles.container)}>
      {/* ─── Header: back arrow • title • logo (prototype) ─── */}
      <div className="v" style={sx(styles.header)}>
        <button className="v btn" type="button" style={sx(styles.headerBtn)} onClick={press(goBack)} >
          <Icon name="chevron-left" size={26} color={INK} />
        </button>

        <div className="v" style={sx(styles.headerCenter)}>
          <span className="t" style={sx(styles.headerTitle)}>{headerTitle}</span>
          <span className="t" style={sx(styles.headerSubtitle)}>
            {showStepUi ? `Step ${step} of ${WORKER_TOTAL_STEPS} • ${headerSubtitle}` : headerSubtitle}
          </span>
        </div>

        <div className="v" style={sx(styles.logoCircle)}>
          <img className="img" alt="" src={imgSrc(LOGO_MARK)} style={sx([styles.logoImage, { objectFit: RESIZE["contain"] }])}  />
        </div>
      </div>

      {/* Step progress — Worker only */}
      {showStepUi && (
        <div className="v" style={sx(styles.progressTrack)}>
          <div className="v"
            style={sx([
              styles.progressFill,
              { width: `${Math.round((Math.min(step, WORKER_TOTAL_STEPS) / WORKER_TOTAL_STEPS) * 100)}%` },
            ])}
          />
        </div>
      )}

      {/* ─── Body: fits one screen, no scrolling in the normal case ─── */}
      <div className="v scroll"
        style={sx(styles.body)}
        
        
        
        
      ><div className="v scroll-content" style={sx(styles.bodyContent)}>
        {!isEditMode && (
          <>
            <div className="v" style={sx(styles.sectionHeader)}>
              <span className="t" style={sx(styles.sectionLabel)}>SELECT ROLE</span>
              <div className="v" style={sx(styles.requiredBadge)}>
                <span className="t" style={sx(styles.requiredBadgeText)}>Required</span>
              </div>
            </div>

            <div className="v" style={sx(styles.segment)}>
              {ROLES.map((r) => {
                const active = role === r.key;
                return (
                  <button className="v btn" type="button"
                    key={r.key}
                    
                    style={sx([styles.segmentItem, active && styles.segmentItemActive])}
                    onClick={press(() => { if (r.key !== role) { setRole(r.key); setStep(1); } })}
                  >
                    <Icon name={r.icon} size={17} color={active ? BLUE : SUBTLE} />
                    <span className="t" style={sx([styles.segmentText, active && styles.segmentTextActive])}>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {renderBody()}
      </div></div>

      {/* ─── Footer: Back + primary action, then Login link ─── */}
      <div className="v" style={sx(styles.footer)}>
        <div className="v" style={sx(styles.buttonRow)}>
          <button className="v btn" type="button" style={sx(styles.btnGhost)} onClick={press(goBack)} disabled={isLoading}>
            <span className="t" style={sx(styles.btnGhostText)}>Back</span>
          </button>

          <button className="v btn" type="button" style={sx(styles.btnPrimary)} onClick={press(submitHandler)} disabled={isLoading}>
            {isLoading ? (
              <Spinner color="#FFF" />
            ) : (
              <>
                <span className="t" style={sx(styles.btnPrimaryText)}>{submitLabel}</span>
                <Icon name="arrow-right" size={17} color="#FFF" style={styles.btnArrow} />
              </>
            )}
          </button>
        </div>

        {!isEditMode && (
          <button className="v btn" type="button" style={sx(styles.haveAccount)} onClick={press(() => navigation.navigate('Login'))}>
            <span className="t" style={sx(styles.haveAccountText)}>
              Already have an account? <span className="t" style={sx(styles.haveAccountLink)}>Login</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF3FF',
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: INK, letterSpacing: 0.2 },
  headerSubtitle: { fontSize: 11.5, color: SUBTLE, marginTop: 1 },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#EDF3FF',
  },
  logoImage: { width: 30, height: 30, borderRadius: 15 },

  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E3EBF9',
    marginHorizontal: 20,
    marginTop: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: BLUE },

  // Body
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, flexGrow: 1 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 2,
  },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: SUBTLE },
  requiredBadge: { backgroundColor: '#E8F1FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  requiredBadgeText: { fontSize: 10, fontWeight: '800', color: BLUE },

  // Role segmented control
  segment: {
    flexDirection: 'row',
    backgroundColor: '#E9EFFB',
    borderRadius: 16,
    padding: 4,
    marginBottom: 14,
  },
  segmentItem: {
    flex: 1,
    height: 42,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: SURFACE,
    elevation: 3,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
  },
  segmentText: { fontSize: 12.5, fontWeight: '700', color: SUBTLE, marginLeft: 6 },
  segmentTextActive: { color: BLUE },

  // Avatar
  avatarWrap: { alignSelf: 'center', width: 78, height: 78, marginBottom: 14 },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1.4,
    borderStyle: 'dashed',
    borderColor: '#B9CBE8',
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 76, height: 76, borderRadius: 38 },
  avatarText: { fontSize: 10.5, color: BLUE, marginTop: 2, fontWeight: '600' },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: SURFACE,
  },

  // Fields
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 16,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    paddingHorizontal: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  fieldIcon: { marginRight: 10 },
  fieldInput: { flex: 1, fontSize: 14.5, color: INK, paddingVertical: 0, height: '100%' },
  fieldInputText: { flex: 1, fontSize: 14.5, color: MUTED },
  fieldInputMultiline: { height: 70, paddingTop: 12 },
  bioField: { height: 88, alignItems: 'flex-start', paddingTop: 14 },
  eyeBtn: { paddingLeft: 8 },

  splitRow: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },

  // Location card
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SOFT_BLUE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SOFT_BLUE_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#D8E6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationIconDone: { backgroundColor: BLUE },
  locationTextWrap: { flex: 1, paddingRight: 8 },
  locationTitle: { fontSize: 13.5, fontWeight: '800', color: INK },
  locationSub: { fontSize: 11.5, color: SUBTLE, marginTop: 2 },
  toggleTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DCE9FF',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 3,
  },
  toggleTrackOn: { backgroundColor: BLUE, alignItems: 'flex-start' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: BLUE },
  toggleKnobOn: { backgroundColor: '#FFFFFF' },

  // Gender chips
  genderRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  genderChip: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: SURFACE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  genderChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  genderText: { fontSize: 14, fontWeight: '700', color: SUBTLE },
  genderTextActive: { color: '#FFFFFF' },

  // Footer
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, backgroundColor: BG },
  buttonRow: { flexDirection: 'row', gap: 12 },
  btnGhost: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E9EFFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: { fontSize: 15, fontWeight: '700', color: SUBTLE },
  btnPrimary: {
    flex: 1.7,
    height: 52,
    borderRadius: 16,
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '800', letterSpacing: 0.2 },
  btnArrow: { marginLeft: 8 },
  // ─── habits (compact 2-up grid so the step fits without scrolling) ───
  habitsHint: { fontSize: 12, color: SUBTLE, marginBottom: 10, lineHeight: 17 },
  habitsLoader: { marginVertical: 18 },
  habitsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  habitCell: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
  },
  habitCellActive: { borderColor: SOFT_BLUE_BORDER, backgroundColor: SOFT_BLUE },
  habitCellText: { flex: 1, fontSize: 11.5, color: SUBTLE, marginLeft: 7, lineHeight: 15 },
  habitCellTextActive: { color: INK, fontWeight: '700' },
  habitsCount: { fontSize: 12, color: SUBTLE, marginTop: 8, marginBottom: 4 },

  haveAccount: { alignSelf: 'center', marginTop: 8, padding: 4 },
  haveAccountText: { fontSize: 12.5, color: SUBTLE },
  haveAccountLink: { color: BLUE, fontWeight: '800' },
});

export default SignupScreen;
