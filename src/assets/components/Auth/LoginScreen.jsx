import React, { useState } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_AUTH } from '../../config';
import { Platform, RESIZE, Spinner, StyleSheet, changeText, imgSrc, press, sx, tin } from '@/web';
import __img_logo_png from '../../images/logo.png';



const LOGO_IMG = __img_logo_png;

const LoginScreen = ({ navigation }) => {
  const [role, setRole] = useState('Client');
  const [emailOrCnic, setEmailOrCnic] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // REMOVED: showLocationModal / targetScreen / userRoleContext state and
  // handleGoToMap() — the login-time "no coordinates found" gate is gone.

  const getIdentifierPlaceholder = () => {
    switch (role) {
      case 'Client': return 'Email';
      case 'Worker': return 'CNIC e.g XXXXX-XXXXXXX-X';
      case 'Company': return 'License Number';
      case 'Police': return 'Badge ID / Service ID';
      default: return 'Email';
    }
  };

  const getIdentifierIcon = () => {
    switch (role) {
      case 'Client': return 'email-outline';
      case 'Worker': return 'card-account-details-outline';
      case 'Company': return 'domain';
      case 'Police': return 'shield-account-outline';
      default: return 'email-outline';
    }
  };

  const getKeyboardType = () => {
    if (role === 'Client') return 'email-address';
    if (role === 'Worker') return 'numeric';
    return 'default';
  };

  const handleLogin = async () => {
    const trimmedIdentifier = emailOrCnic.trim();
    // Passwords are sent exactly as typed (spaces can be part of a password).
    const trimmedPassword = password;

    if (!trimmedIdentifier || !trimmedPassword.trim()) {
      NotificationHelper.showError("Please enter your credentials.");
      return;
    }

    setIsLoading(true);
    const url = `${API_AUTH}/Login`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          Role: role,
          EmailOrCnic: trimmedIdentifier,
          Password: trimmedPassword
        })
      });

      // Read as text first so a non-JSON error body (e.g. a 5xx page) does not break parsing.
      const rawText = await response.text();
      let result = {};
      try { result = rawText ? JSON.parse(rawText) : {}; } catch { result = { message: rawText.slice(0, 180) }; }

      if (response.ok) {
        console.log('✅ Login API Response (OK):', { role: result.role, clientId: result.clientId });
        
        // 1. Prepare key-value pairs for atomic batch storage
        const storageItems = [
          ['userToken', result.token || ''],
          ['userRole', result.role || role],
          ['userName', result.name || ''],
          ['userPicture', result.picture || ''],
          ['userAddress', result.address || ''],
          ['userPhone', result.phone || ''],
          ['userEmail', result.email || (role === 'Client' ? trimmedIdentifier : '')],
        ];

        // 2. Add role-specific IDs safely if provided
        if (result.clientId != null) storageItems.push(['clientId', result.clientId.toString()]);
        if (result.workerId != null) storageItems.push(['workerId', result.workerId.toString()]);
        if (result.companyId != null) storageItems.push(['companyId', result.companyId.toString()]);
        if (result.policeId != null) storageItems.push(['policeId', result.policeId.toString()]);

        // Save everything to AsyncStorage
        // Clear the previous session first so IDs from another account never linger.
        await AsyncStorage.clear();
        await AsyncStorage.multiSet(storageItems);
        console.log('✅ AsyncStorage: Saved token, role, clientId, and user info');

        NotificationHelper.showSuccess("Login Successful!");

        // 3. Navigate by role (no location gate here any more)
        const userRole = result.role || role;

        if (userRole === 'Client') {
          console.log('🔄 Navigating to FindServiceScreen');
          navigation.replace('FindServiceScreen');
        } else if (userRole === 'Worker') {
          console.log('🔄 Navigating to WorkerDashboardScreen');
          navigation.replace('WorkerDashboardScreen');
        } else if (userRole === 'Company') {
          console.log('🔄 Navigating to CompanyCourseDashboardScreen');
          navigation.replace('CompanyCourseDashboardScreen');
        } else if (userRole === 'Police') {
          navigation.replace('PoliceVerificationPortal');
        } else {
          NotificationHelper.showSuccess(`${userRole} account logged in successfully!`);
        }
      } else {
        NotificationHelper.showError(result.message || "Invalid credentials.");
      }
    } catch (error) {
      console.error('Login Error:', error);
      NotificationHelper.showError("Cannot reach the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="v screen" style={sx(styles.container)}>
      <div className="v"
        
        style={sx(styles.innerContainer)}
      >
        <div className="v" style={sx(styles.circleTopLeft)} />

        <div className="v" style={sx(styles.logoContainer)}>
          <div className="v" style={sx(styles.logoCircle)}>
            <img className="img" alt=""
              src={imgSrc(LOGO_IMG)}
              style={sx([styles.logoImage, { objectFit: RESIZE["contain"] }])}
              
            />
          </div>
          <span className="t" style={sx(styles.brandName)}>Maid & Servant Online</span>
        </div>

        <div className="v" style={sx(styles.formContainer)}>
          <div className="v" style={sx(styles.roleGrid)}>
            <button className="v btn" type="button"
              style={sx([styles.roleButton, role === 'Client' && styles.activeRole])}
              onClick={press(() => { setRole('Client'); setEmailOrCnic(''); })}>
              <Icon name="account-outline" size={22} color={role === 'Client' ? "#1E64D3" : "#000"} />
              <span className="t" style={sx(styles.roleText)}>Client</span>
            </button>

            <button className="v btn" type="button"
              style={sx([styles.roleButton, role === 'Worker' && styles.activeRole])}
              onClick={press(() => { setRole('Worker'); setEmailOrCnic(''); })}>
              <Icon name="account-group-outline" size={22} color={role === 'Worker' ? "#1E64D3" : "#000"} />
              <span className="t" style={sx(styles.roleText)}>Worker</span>
            </button>

            <button className="v btn" type="button"
              style={sx([styles.roleButton, role === 'Company' && styles.activeRole])}
              onClick={press(() => { setRole('Company'); setEmailOrCnic(''); })}>
              <Icon name="domain" size={22} color={role === 'Company' ? "#1E64D3" : "#000"} />
              <span className="t" style={sx(styles.roleText)}>Company</span>
            </button>

            <button className="v btn" type="button"
              style={sx([styles.roleButton, role === 'Police' && styles.activeRole])}
              onClick={press(() => { setRole('Police'); setEmailOrCnic(''); })}>
              <Icon name="shield-check-outline" size={22} color={role === 'Police' ? "#1E64D3" : "#000"} />
              <span className="t" style={sx(styles.roleText)}>Police</span>
            </button>
          </div>

          <div className="v" style={sx(styles.inputWrapper)}>
            <div className="v" style={sx(styles.iconBackground)}>
              <Icon name={getIdentifierIcon()} size={24} color="#1E64D3" />
            </div>
            <input className="input" {...tin({ keyboardType: getKeyboardType(), autoCapitalize: "none" })}
              style={{ ...sx(styles.input), '--ph': "#999" }}
              placeholder={getIdentifierPlaceholder()}
              
              value={(emailOrCnic) ?? ''}
              onChange={changeText(setEmailOrCnic)}
              
              
            />
          </div>

          <div className="v" style={sx([styles.inputWrapper, styles.marginTop])}>
            <div className="v" style={sx(styles.iconBackground)}>
              <Icon name="lock-outline" size={24} color="#1E64D3" />
            </div>
            <input className="input" {...tin({ secureTextEntry: !isPasswordVisible })}
              style={{ ...sx(styles.input), '--ph': "#999" }}
              placeholder="Password"
              
              value={(password) ?? ''}
              onChange={changeText(setPassword)}
              
            />
            <button className="v btn" type="button" onClick={press(() => setPasswordVisible(!isPasswordVisible))}>
              <Icon
                name={isPasswordVisible ? "eye-off" : "eye"}
                size={22}
                color="#666"
                style={styles.eyeIcon}
              />
            </button>
          </div>

          <div className="v" style={sx(styles.rowBetween)}>
            <button className="v btn" type="button"
              style={sx(styles.checkboxRow)}
              onClick={press(() => setRememberMe(!rememberMe))}
            >
              <Icon
                name={rememberMe ? "checkbox-marked" : "checkbox-blank-outline"}
                size={22}
                color="#1E64D3"
              />
              <span className="t" style={sx(styles.rememberText)}>Remember Me</span>
            </button>
            <button className="v btn" type="button">
              <span className="t" style={sx(styles.forgotText)}>Forgot Password?</span>
            </button>
          </div>

          <button className="v btn" type="button"
            style={sx(styles.signInButton)}
            onClick={press(handleLogin)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner color="#1E64D3" />
            ) : (
              <span className="t" style={sx(styles.signInText)}>Sign in</span>
            )}
          </button>

          <span className="t" style={sx(styles.orText)}>OR</span>

          <button className="v btn" type="button"
            style={sx(styles.signupButton)}
            onClick={press(() => navigation.navigate('Signup'))}
          >
            <span className="t" style={sx(styles.signupText)}>Signup</span>
          </button>
        </div>
      </div>

    </div>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBFF' },
  innerContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 30 },
  circleTopLeft: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#D6EAF8',
    zIndex: -1,
  },
  logoContainer: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  logoImage: { width: '90%', height: '90%', borderRadius: 25 },
  brandName: { marginTop: 15, fontSize: 20, fontWeight: 'bold', color: '#2C437E' },
  formContainer: { width: '100%' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 15 },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EEE',
    elevation: 3,
    backgroundColor: '#FFF',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  activeRole: { backgroundColor: '#E0DADA' },
  roleText: { marginLeft: 8, fontWeight: 'bold', color: '#000', textAlign: 'center' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 60,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  marginTop: { marginTop: 15 },
  iconBackground: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  eyeIcon: {
    padding: 5,
    alignSelf: 'center',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 25 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  rememberText: { marginLeft: 8, color: '#555', fontSize: 14 },
  forgotText: { color: '#1E64D3', fontSize: 14, fontWeight: '600' },
  signInButton: {
    backgroundColor: '#FFF',
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E64D3',
    elevation: 3,
  },
  signInText: { color: '#1E64D3', fontSize: 18, fontWeight: 'bold' },
  orText: { textAlign: 'center', marginVertical: 15, color: '#888', fontSize: 14 },
  signupButton: {
    backgroundColor: '#1E64D3',
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  signupText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default LoginScreen;