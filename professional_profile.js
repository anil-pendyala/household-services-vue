const ProfessionalProfile = {
  template: `
    <div class="container mt-4 pt-5" style="max-width: 1200px;">
      <h2 class="mb-4">My Professional Profile</h2>

      <!-- Loading indicator -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading your professional profile...</p>
      </div>

      <!-- Error Alert -->
      <div v-else-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <!-- Profile content -->
      <div v-else class="row">
        <!-- Profile Header -->
        <div class="col-12 mb-4">
          <div class="card shadow-sm">
            <div class="card-body">
              <div class="row align-items-center">
                <div class="col-md-3 text-center">
                  <div class="position-relative">
                    
                    <button class="btn btn-sm btn-outline-secondary position-absolute bottom-0 end-0" @click="uploadProfilePicture">
                      <i class="fas fa-camera"></i>
                    </button>
                  </div>
                </div>
                <div class="col-md-9">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h2 class="card-title mb-1">{{ profileData.name }}</h2>
                      <p class="text-muted mb-2">{{ profileData.service_name }}</p>
                    </div>
                    <div>
                      <span class="badge bg-success me-2 px-3 py-2" v-if="profileData.is_verified">
                        <i class="fas fa-check-circle me-1"></i>Verified
                      </span>
                      <span class="badge bg-warning me-2 px-3 py-2" v-else>
                        <i class="fas fa-hourglass-half me-1"></i>Pending Verification
                      </span>
                    </div>
                  </div>

                  <div class="d-flex align-items-center mb-3">
                    <div class="me-4">
                      <span class="fs-4 fw-bold me-1">{{ profileData.rating.toFixed(1) }}</span>
                      <span class="text-warning fs-4">
                        <i v-for="n in 5" :key="n"
                           :class="n <= Math.round(profileData.rating) ? 'fas fa-star' : 'far fa-star'">
                        </i>
                      </span>
                    </div>
                    <div class="text-muted">
                      {{ completedServices }} services completed | {{ profileData.experience }} years experience
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Details and Stats -->
        <div class="col-lg-8">
          <!-- About Section -->
          <div class="card mb-4 shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Professional Overview</h5>
              <button class="btn btn-sm btn-outline-primary" @click="showEditModal('about')">
                <i class="fas fa-edit me-1"></i> Edit
              </button>
            </div>
            <div class="card-body">
              <p v-if="profileData.description">{{ profileData.description }}</p>
              <p v-else class="text-muted fst-italic">
                Share your professional journey, skills, and what makes you unique.
              </p>
            </div>
          </div>

          <!-- Detailed Service Statistics -->
          <div class="card shadow-sm mb-4">
            <div class="card-header">
              <h5 class="mb-0">Service Performance</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-4 text-center">
                  <h6>Completed Services</h6>
                  <div class="display-6 text-success">{{ completedServices }}</div>
                </div>
                <div class="col-md-4 text-center">
                  <h6>Ongoing Services</h6>
                  <div class="display-6 text-primary">{{ ongoingServices }}</div>
                </div>
                <div class="col-md-4 text-center">
                  <h6>Requested Services</h6>
                  <div class="display-6 text-warning">{{ requestedServices }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Reviews Section -->
          <div class="card shadow-sm">
            <div class="card-header">
              <h5 class="mb-0">Recent Reviews</h5>
            </div>
            <div class="card-body">
              <div v-if="reviews.length === 0" class="text-center py-3">
                <p class="text-muted mb-0">No reviews yet. Complete more services to get customer feedback.</p>
              </div>
              <div v-else>
                <div v-for="review in reviews" :key="review.id" class="border-bottom pb-3 mb-3">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <span class="fw-bold">{{ review.customer_name }}</span>
                      <span class="text-muted ms-2">{{ formatDate(review.date_created) }}</span>
                    </div>
                    <div class="text-warning">
                      <i v-for="n in 5" :key="n"
                         :class="n <= review.rating ? 'fas fa-star' : 'far fa-star'">
                      </i>
                    </div>
                  </div>
                  <p class="mb-1">{{ review.review_text || 'No comment provided.' }}</p>
                  <p class="text-muted small mb-0">Service: {{ review.service_name }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar Account Information -->
        <div class="col-lg-4">
          <!-- Account Information -->
          <div class="card shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Account Details</h5>
              <button class="btn btn-sm btn-outline-primary" @click="showEditModal('account')">
                <i class="fas fa-edit me-1"></i> Edit
              </button>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="text-muted small">Name</label>
                <div class="fw-medium">{{ profileData.name }}</div>
              </div>
              <div class="mb-3">
                <label class="text-muted small">Email</label>
                <div class="fw-medium">{{ profileData.email }}</div>
              </div>
              <div class="mb-3">
                <label class="text-muted small">Service Category</label>
                <div class="fw-medium">{{ profileData.service_name }}</div>
              </div>
              <div>
                <label class="text-muted small">Experience</label>
                <div class="fw-medium">{{ profileData.experience }} years</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Profile Modal -->
      <div class="modal fade" id="editProfileModal" tabindex="-1" aria-labelledby="editProfileModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="editProfileModalLabel">Edit {{ editSection }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <!-- Dynamic form content will be added based on editSection -->
              <form @submit.prevent="saveProfileChanges">
                <div v-if="editSection === 'about'">
                  <div class="mb-3">
                    <label for="profileDescription" class="form-label">Professional Description</label>
                    <textarea
                      id="profileDescription"
                      class="form-control"
                      v-model="editedDescription"
                      rows="4"
                      placeholder="Share your professional journey, skills, and what makes you unique."
                    ></textarea>
                  </div>
                </div>

                <div v-else-if="editSection === 'account'">
                  <div class="mb-3">
                    <label for="profileName" class="form-label">Name</label>
                    <input
                      type="text"
                      id="profileName"
                      class="form-control"
                      v-model="editedName"
                    />
                  </div>
                  <div class="mb-3">
                    <label for="profileEmail" class="form-label">Email</label>
                    <input
                      type="email"
                      id="profileEmail"
                      class="form-control"
                      v-model="editedEmail"
                    />
                  </div>
                </div>

                <button type="submit" class="btn btn-primary">Save Changes</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      loading: true,
      errorMessage: '',
      profileData: {
        name: '',
        service_name: '',
        is_verified: false,
        rating: 0,
        description: '',
        email: '',
        experience: 0,
        profile_picture: null
      },
      completedServices: 0,
      ongoingServices: 0,
      reviews: [],
      requestedServices: 0,

      // Edit modal related data
      editSection: '',
      editedDescription: '',
      editedName: '',
      editedEmail: ''
    };
  },

  methods: {
    fetchProfileData() {
      const professionalId = localStorage.getItem('userId');

      this.loading = true;
      this.errorMessage = '';

      axios.get(`http://127.0.0.1:5000/professionals/${professionalId}/profile`)
        .then(response => {
          this.profileData = response.data;
          this.completedServices = response.data.completed_services || 0;
          this.ongoingServices = response.data.ongoing_services || 0;
          this.reviews = response.data.reviews || [];
          this.loading = false;
        })
        .catch(error => {
          console.error('Error fetching profile data:', error);
          this.errorMessage = 'Unable to load profile. Please try again later.';
          this.loading = false;
        });
    },

    fetchExtendedStatistics() {
      const professionalId = localStorage.getItem('userId');

      axios.get(`http://127.0.0.1:5000/professionals/${professionalId}/extended-statistics`)
        .then(response => {
          const stats = response.data;
          this.requestedServices = stats.requested_services || 0;
        })
        .catch(error => {
          console.error('Error fetching extended statistics:', error);
        });
    },

    uploadProfilePicture() {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = this.handleProfilePictureUpload;
      fileInput.click();
    },

    handleProfilePictureUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('profile_picture', file);
        formData.append('professional_id', localStorage.getItem('userId'));

        axios.post(`http://127.0.0.1:5000/professionals/upload-profile-picture`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then(response => {
          // Update profile picture URL
          this.profileData.profile_picture = response.data.profile_picture_url;
        })
        .catch(error => {
          console.error('Error uploading profile picture:', error);
          alert('Failed to upload profile picture');
        });
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },

    showEditModal(section) {
      this.editSection = section;

      if (section === 'about') {
        this.editedDescription = this.profileData.description || '';
      } else if (section === 'account') {
        this.editedName = this.profileData.name;
        this.editedEmail = this.profileData.email;
      }

      // Use Bootstrap modal method to show the modal
      const editModal = new bootstrap.Modal(document.getElementById('editProfileModal'));
      editModal.show();
    },

    saveProfileChanges() {
      const professionalId = localStorage.getItem('userId');
      const updateData = {};

      if (this.editSection === 'about') {
        updateData.description = this.editedDescription;
      } else if (this.editSection === 'account') {
        updateData.name = this.editedName;
        updateData.email = this.editedEmail;
      }

      axios.patch(`http://127.0.0.1:5000/professionals/${professionalId}/profile`, updateData)
        .then(response => {
          // Update local data
          if (this.editSection === 'about') {
            this.profileData.description = this.editedDescription;
          } else if (this.editSection === 'account') {
            this.profileData.name = this.editedName;
            this.profileData.email = this.editedEmail;
          }

          // Close the modal
          const editModal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
          editModal.hide();
        })
        .catch(error => {
          console.error('Error updating profile:', error);
          alert('Failed to update profile. Please try again.');
        });
    }
  },

  mounted() {
    this.fetchProfileData();
    this.fetchExtendedStatistics();
  }
};
