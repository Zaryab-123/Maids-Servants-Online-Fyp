import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import { SERVER_BASE } from '../../config';
import { Spinner, StyleSheet, imgSrc, press, sx } from '@/web';


const WorkerTerminatedScreen = ({ navigation, route }) => {
    const { workerId } = route?.params || {};

    const [terminationData, setTerminationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (workerId) {
            fetchTerminationDetails();
        } else {
            setErrorMsg('Worker routing parameters missing.');
            setLoading(false);
        }
    }, [workerId]);

    const fetchTerminationDetails = async () => {
        try {
            setLoading(true);
            setErrorMsg('');
            const token = await AsyncStorage.getItem('userToken');
            
            // Calling the new unified resignation/termination endpoint
            const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetWorkerEndContractDetails/${workerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                
                setTerminationData({
                    worker: {
                        name: data.workerName,
                        role: data.workerSkill,
                        address: data.workerAddress,
                        phone: data.workerPhone,
                        experience: 'Active Job Record',
                        avatar: data.workerPicture ? `${SERVER_BASE}${data.workerPicture}` : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                    },
                    details: {
                        status: data.status, // Dynamic status state: "Resigned" or "Terminated"
                        date: data.date,
                        reason: data.reason
                    },
                    client: {
                        name: data.clientName,
                        address: data.clientAddress,
                        avatar: data.clientPicture ? `${SERVER_BASE}${data.clientPicture}` : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                    }
                });
            } else if (response.status === 404) {
                setErrorMsg('No contract exit status found for this worker.');
            } else {
                setErrorMsg('Failed to fetch job data from backend server.');
            }
        } catch (error) {
            setErrorMsg('Network connectivity error.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="v screen" style={sx([styles.container, { justifyContent: 'center', alignItems: 'center' }])}>
                <Spinner size="large" color="#2C3BE0" />
            </div>
        );
    }

    if (errorMsg || !terminationData) {
        return (
            <div className="v screen" style={sx([styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }])}>
                <Icon name="alert-circle-outline" size={60} color="#FF3D00" />
                <span className="t" style={sx({ fontSize: 16, color: '#333', textAlign: 'center', marginTop: 15, marginBottom: 20 })}>{errorMsg}</span>
                <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx({ backgroundColor: '#2C3BE0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 })}>
                    <span className="t" style={sx({ color: '#FFF', fontWeight: 'bold' })}>Go Back</span>
                </button>
            </div>
        );
    }

    // Dynamic strings depending on backend payload state flag values
    const isResigned = terminationData.details.status === 'Resigned';

    return (
        <div className="v screen" style={sx(styles.container)}>
            

            {/* Background Decoration */}
            <div className="v" style={sx(styles.bgCircle)} />

            <div className="v" style={sx(styles.header)}>
                <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backBtn)}>
                    <Icon name="arrow-left" size={24} color="#555" />
                </button>
                <span className="t" style={sx(styles.breadcrumb)}>Contract {'>'} Worker <span className="t" style={sx(styles.blueText)}>{terminationData.details.status}</span></span>
                <img className="img" alt=""
                    src={imgSrc({ uri: 'https://servantmaidonline.com/logo.png' })}
                    style={sx(styles.logo)}
                />
            </div>

            <div className="v scroll" ><div className="v scroll-content" style={sx(styles.scrollContent)}>
                {/* Warning Banner shifts message dynamically based on status context */}
                <div className="v" style={sx(styles.warningBanner)}>
                    <Icon name="alert" size={30} color="#FF3D00" />
                    <span className="t" style={sx(styles.warningText)}>
                        {isResigned ? 'WORKER RESIGNED' : 'WORKER TERMINATED'}
                    </span>
                </div>

                {/* Worker Details Section */}
                <div className="v" style={sx(styles.sectionCard)}>
                    <div className="v" style={sx(styles.sectionHeader)}>
                        <Icon name="account" size={20} color="#999" />
                        <span className="t" style={sx(styles.sectionHeaderTitle)}>WORKER DETAILS</span>
                    </div>

                    <div className="v" style={sx(styles.profileRow)}>
                        <img className="img" alt="" src={imgSrc({ uri: terminationData.worker.avatar })} style={sx(styles.avatarLarge)} />
                        <div className="v" style={sx(styles.infoCol)}>
                            <span className="t" style={sx(styles.infoLabel)}>Name:<span className="t" style={sx(styles.bold)}> {terminationData.worker.name}</span></span>
                            <span className="t" style={sx(styles.infoLabel)}>Job Role: {terminationData.worker.role}</span>
                            <span className="t" style={sx(styles.infoLabel)}>Address: {terminationData.worker.address}</span>
                            <span className="t" style={sx(styles.infoLabel)}>Phone: {terminationData.worker.phone}</span>
                        </div>
                    </div>

                    <div className="v" style={sx(styles.divider)} />

                    <div className="v" style={sx(styles.statusSection)}>
                        <span className="t" style={sx(styles.statusItem)}><span className="t" style={sx(styles.bold)}>Status :</span> {terminationData.details.status}</span>
                        <span className="t" style={sx(styles.statusItem)}><span className="t" style={sx(styles.bold)}>Date:</span> {terminationData.details.date}</span>
                        <span className="t" style={sx(styles.statusItem)}><span className="t" style={sx(styles.bold)}>Reason:</span> {terminationData.details.reason}</span>
                    </div>
                </div>

                <span className="t" style={sx(styles.footerNote)}>
                    {isResigned ? 'Worker has resigned and contract is closed.' : 'You have terminated this worker.'}
                </span>
                <div className="v" style={sx(styles.bulletSection)}>
                    <span className="t" style={sx(styles.bullet)}>• No further active duties under this handshake profile</span>
                    <span className="t" style={sx(styles.bullet)}>• Historic logs preserved into matching database tables successfully</span>
                </div>

                {/* Client Details Section */}
                <span className="t" style={sx(styles.clientMainTitle)}>Client Details</span>
                <div className="v" style={sx(styles.clientCard)}>
                    <img className="img" alt="" src={imgSrc({ uri: terminationData.client.avatar })} style={sx(styles.avatarSmall)} />
                    <div className="v" style={sx(styles.clientInfo)}>
                        <span className="t" style={sx(styles.clientLabel)}>
                            {isResigned ? 'Worker Left Job Profile' : 'Client Terminated Worker'}
                        </span>
                        <span className="t" style={sx(styles.infoLabel)}>Name:<span className="t" style={sx(styles.bold)}> {terminationData.client.name}</span></span>
                        <span className="t" style={sx(styles.infoLabel)}>Address: {terminationData.client.address}</span>
                    </div>
                </div>
            </div></div>
        </div>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    bgCircle: {
        position: 'absolute',
        top: -40,
        left: -40,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#E3F2FD',
        zIndex: -1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 10,
    },
    backBtn: { padding: 5 },
    breadcrumb: { fontSize: 16, color: '#666' },
    blueText: { color: '#2C3BE0', fontWeight: 'bold' },
    logo: { width: 40, height: 40 },
    scrollContent: { paddingHorizontal: 15, paddingBottom: 30 },

    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4C3',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D4E157',
        marginBottom: 20,
        elevation: 2
    },
    warningText: { fontSize: 18, fontWeight: 'bold', color: '#000', marginLeft: 15 },

    sectionCard: {
        borderWidth: 1,
        borderColor: '#999',
        borderRadius: 8,
        backgroundColor: '#FFF',
        overflow: 'hidden',
        marginBottom: 20
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#999'
    },
    sectionHeaderTitle: { fontSize: 16, color: '#666', marginLeft: 10, fontWeight: '500' },
    profileRow: { flexDirection: 'row', padding: 15, alignItems: 'center' },
    avatarLarge: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: '#EEE' },
    infoCol: { marginLeft: 15, flex: 1 },
    infoLabel: { fontSize: 14, color: '#666', marginBottom: 2 },
    bold: { fontWeight: 'bold', color: '#000' },
    divider: { height: 1, backgroundColor: '#EEE', marginHorizontal: 15 },
    statusSection: { padding: 15 },
    statusItem: { fontSize: 16, color: '#333', marginBottom: 8 },

    footerNote: { fontSize: 14, color: '#999', textAlign: 'center', marginVertical: 15 },
    bulletSection: { paddingHorizontal: 10, marginBottom: 20 },
    bullet: { fontSize: 12, color: '#333', fontStyle: 'italic', marginBottom: 2 },

    clientMainTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    clientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#DDD',
        backgroundColor: '#FFF',
        elevation: 3
    },
    avatarSmall: { width: 80, height: 80, borderRadius: 40 },
    clientInfo: { marginLeft: 15 },
    clientLabel: { color: '#2C3BE0', fontWeight: 'bold', fontSize: 14, marginBottom: 5 }
});

export default WorkerTerminatedScreen;