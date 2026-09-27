import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import { API_DASHBOARD } from '../../config';
import { Spinner, StyleSheet, imgSrc, press, sx } from '@/web';
import __img_logo_png from '../../images/logo.png';


const RatingAndReviewsScreen = ({ navigation, route }) => {
    const { workerId, initialRating, initialReviewCount } = route.params || {};

    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(initialRating || "0.0");
    const [reviewCount, setReviewCount] = useState(initialReviewCount || 0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (workerId) {
            fetchReviews();
        } else {
            setIsLoading(false);
        }
    }, [workerId]);

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_DASHBOARD}/GetWorkerReviews/${workerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setReviews(data.reviews || []);
                setAverageRating(data.averageRating?.toString() || "0.0");
                setReviewCount(data.reviewCount || 0);
            } else {
                console.error("Failed to fetch reviews");
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStars = (rating) => {
        let stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Icon
                    key={i}
                    name={i <= Math.round(rating) ? "star" : "star-outline"}
                    size={18}
                    color={i <= Math.round(rating) ? "#FFD700" : "#E0E0E0"}
                />
            );
        }
        return stars;
    };

    const renderHeaderStars = (rating) => {
        let stars = [];
        const roundedRating = Math.round(parseFloat(rating));
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Icon key={i} name={i <= roundedRating ? "star" : "star-outline"} size={30} color={i <= roundedRating ? "#FFD700" : "#E0E0E0"} />
            );
        }
        return stars;
    };

    return (
        <div className="v screen" style={sx(styles.container)}>
            

            {/* Header bar matching standard app header */}
            <div className="v" style={sx(styles.headerBar)}>
                <div className="v" style={sx(styles.headerLeft)}>
                    <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backBtn)}>
                        <Icon name="arrow-left" size={24} color="#1F2937" />
                    </button>
                    <span className="t" style={sx(styles.headerTitle)}>Rating & Reviews</span>
                </div>
                <div className="v" style={sx(styles.logoBox)}>
                    <img className="img" alt=""
                        src={imgSrc(__img_logo_png)}
                        style={sx(styles.logoImage)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="v" style={sx(styles.loaderContainer)}>
                    <Spinner size="large" color="#1E75EB" />
                    <span className="t" style={sx(styles.loaderText)}>Loading your reviews...</span>
                </div>
            ) : (
                <div className="v scroll"  ><div className="v scroll-content card-grid" style={sx(styles.scrollContent)}>
                    {/* Overall Rating Header Card */}
                    <div className="v" style={sx(styles.headerCard)}>
                        <span className="t" style={sx(styles.cardHeaderTitle)}>Your Overall Rating</span>
                        <div className="v" style={sx(styles.ratingRow)}>
                            <span className="t" style={sx(styles.bigRating)}>{averageRating}</span>
                            <div className="v" style={sx(styles.headerStars)}>
                                {renderHeaderStars(averageRating)}
                            </div>
                        </div>
                        <span className="t" style={sx(styles.reviewCount)}>Based on {reviewCount} Reviews</span>
                    </div>

                    {/* Reviews List */}
                    {reviews.length > 0 ? (
                        reviews.map((item) => (
                            <div className="v grid-item" key={item.id} style={sx(styles.reviewCard)}>
                                <div className="v" style={sx(styles.cardTop)}>
                                    <div className="v">
                                        <button className="v btn" type="button"
                                            onClick={press(() => {
                                                if (item.clientId) {
                                                    navigation.navigate('ClientProfileScreen', {
                                                        clientId: item.clientId,
                                                        id: item.clientId
                                                    });
                                                } else {
                                                    console.warn("Client ID is missing for this review.");
                                                }
                                            })}
                                        >
                                            <span className="t" style={sx(styles.reviewerName)}>{item.name}</span>
                                        </button>
                                        <div className="v" style={sx(styles.dateRow)}>
                                            <Icon name="calendar-range" size={14} color="#888" />
                                            <span className="t" style={sx(styles.employerDuration)}>{item.date}</span>
                                        </div>
                                        {item.workedPeriod ? (
                                            <div className="v" style={sx(styles.workedRow)}>
                                                <Icon name="briefcase-outline" size={14} color="#1E75EB" />
                                                <span className="t" style={sx(styles.workedPeriodText)}>Worked: {item.workedPeriod}</span>
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="v" style={sx(styles.starRow)}>
                                        {renderStars(item.rating)}
                                    </div>
                                </div>
                                <span className="t" style={sx(styles.commentText)}>"{item.comment}"</span>
                            </div>
                        ))
                    ) : (
                        <div className="v" style={sx(styles.emptyContainer)}>
                            <Icon name="message-draw" size={50} color="#DDD" />
                            <span className="t" style={sx(styles.emptyText)}>You don't have any reviews yet.</span>
                        </div>
                    )}
                </div></div>
            )}
        </div>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6FC',
    },
    /* ── Header ── */
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        padding: 4,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.3,
    },
    logoBox: {
        width: 110,
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    logoImage: {
        width: 110,
        height: 90,
        resizeMode: 'contain',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 30,
    },
    headerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bigRating: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#1E4A84',
        marginRight: 15,
    },
    headerStars: {
        flexDirection: 'row',
    },
    reviewCount: {
        fontSize: 16,
        color: '#888',
        marginTop: 5,
    },
    reviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    reviewerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    employerDuration: {
        fontSize: 12,
        color: '#888',
        marginLeft: 4,
    },
    starRow: {
        flexDirection: 'row',
    },
    commentText: {
        fontSize: 13,
        color: '#555',
        fontStyle: 'italic',
        lineHeight: 18,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 10,
        fontSize: 16,
        color: '#1E75EB',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    workedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
    },
    workedPeriodText: {
        fontSize: 12,
        color: '#1E75EB',
        fontWeight: '600',
        marginLeft: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#999',
        fontStyle: 'italic',
    },
});

export default RatingAndReviewsScreen;