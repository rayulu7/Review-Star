import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './Profile.css';
import { db, collection, getDocs, auth, signOut } from './firebase';

const Profile = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentUser(user);
      console.log('Current Auth User UID:', user.uid);

      try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const userList = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('Loaded users from Firestore:', userList);
        setUsers(userList);
        if (userList.length === 0) {
          toast.warn('No users found in Firestore!');
        } else {
          toast.success('Users loaded successfully!');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load user data.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully!');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error.message);
      toast.error('Failed to log out.');
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      if (tag === 'all') return ['all'];
      if (prev.includes('all')) return [tag];
      if (prev.includes(tag)) return prev.filter(t => t !== tag);
      return [...prev, tag];
    });
  };

  const removeTag = (tagToRemove) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const currentUserData = users.find(u => u.uid === currentUser?.uid);

  const filteredUsers = users
    .filter(user => {
      const fullName = `${user.fname} ${user.lname}`.toLowerCase();
      const email = user.email?.toLowerCase() || '';
      const searchTermLower = searchTerm.toLowerCase();
      return fullName.includes(searchTermLower) || email.includes(searchTermLower);
    })
    .filter(user => {
      if (selectedTags.includes('all') || selectedTags.length === 0) return true;
      return selectedTags.includes(user.gender?.toLowerCase());
    });

  return (
    <div className="profile-container">
      <header>
        <h1>housing.in</h1>
      </header>

      <div className="content-container">
        <div className="filters">
          <h3>Filter by Gender</h3>
          <div className="gender-filter-box">
            <label>
              <input
                type="radio"
                name="gender"
                value="male"
                checked={selectedTags.includes('male')}
                onChange={() => toggleTag('male')}
              />
              Male
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="female"
                checked={selectedTags.includes('female')}
                onChange={() => toggleTag('female')}
              />
              Female
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="all"
                checked={selectedTags.includes('all')}
                onChange={() => toggleTag('all')}
              />
              All
            </label>
          </div>
        </div>

        <div className="table-section">
          <div className="filter-tags">
            <span className="filter-applied">Filter applied</span>
            {selectedTags.map(tag => (
              <button key={tag} className="tag-button" onClick={() => removeTag(tag)}>
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
                <span className="close-tag">&times;</span>
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search by Name or Email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {loading ? (
            <div className="loader-container">
              <img src="/PageLoading.gif" alt="Loading..." className="table-loader" />
            </div>
          ) : (
            <div className="user-data-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>DOB</th>
                    <th>Gender</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => {
                    const isSelf = currentUser?.uid === user.uid;

                    const currentGender = String(currentUserData?.gender).trim().toLowerCase();
                    const targetGender = String(user.gender).trim().toLowerCase();

                    const canReview =
                      !isSelf &&
                      ['male', 'female'].includes(currentGender) &&
                      ['male', 'female'].includes(targetGender) &&
                      currentGender !== targetGender;

                    return (
                      <tr key={user.id}>
                        <td>
                          <span
                            className="user-link"
                            style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => navigate(`/user/${user.uid}`)}
                          >
                            {user.fname} {user.lname}
                          </span>
                        </td>
                        <td>{user.dob || '-'}</td>
                        <td>{user.gender || '-'}</td>
                        <td>{user.email}</td>
                        <td>{user.phone || '-'}</td>
                        <td>
                          {user.address?.address}, {user.address?.state}, {user.address?.pin}, {user.address?.country}
                        </td>
                        <td>
                          {canReview ? (
                            <button
                              className="write-review-btn"
                              onClick={() => navigate(`/review/${user.uid}`)} 
                            >
                              Review
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <button className="logout-btn" onClick={handleLogout}>Logout</button>
      <ToastContainer />
    </div>
  );
};

export default Profile;