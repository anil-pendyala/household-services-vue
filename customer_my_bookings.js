const MyBookings = {
  template: `
    <div class="container mt-4" style="max-width: 1000px;">
      <h2 class="mb-4">My Bookings</h2>

      <!-- Tab navigation -->
      <ul class="nav nav-tabs mb-4">
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'pending' }"
             @click.prevent="activeTab = 'pending'" href="#">
            Pending
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'ongoing' }"
             @click.prevent="activeTab = 'ongoing'" href="#">
            Ongoing
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'completed' }"
             @click.prevent="activeTab = 'completed'" href="#">
            Completed
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'cancelled' }"
             @click.prevent="activeTab = 'cancelled'" href="#">
            Cancelled
          </a>
        </li>
      </ul>

      <!-- Pending Requests Tab -->
      <div v-if="activeTab === 'pending'">
        <div v-if="pendingRequests.length === 0" class="alert alert-info">
          You don't have any pending service requests.
        </div>

        <div v-for="request in pendingRequests" :key="request.id" class="card mb-3 shadow-sm">
          <div class="card-body">
            <div class="row">
              <div class="col-md-8">
                <h5 class="card-title">{{ request.service_name }}</h5>
                <p class="card-text">
                  <strong>Requested on:</strong> {{ formatDate(request.date_of_request) }}<br>
                  <strong>Preferred Date:</strong> {{ formatDate(request.preferred_date) }}<br>
                  <strong>Preferred Time:</strong> {{ formatTimeSlot(request.preferred_time) }}<br>
                  <strong>Location:</strong> {{ request.location }} - {{ request.pin_code }}<br>
                  <strong>Status:</strong> <span class="badge bg-warning">{{ formatStatus(request.service_status) }}</span>
                </p>
                <p v-if="request.remarks" class="card-text"><strong>Remarks:</strong> {{ request.remarks }}</p>
              </div>
              <div class="col-md-4 d-flex flex-column justify-content-center align-items-end">
                <button @click="openEditModal(request)" class="btn btn-outline-primary mb-2 w-100">
                  Edit
                </button>
                <button @click="cancelRequest(request.id)" class="btn btn-outline-danger w-100">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ongoing Requests Tab -->
      <div v-if="activeTab === 'ongoing'">
        <div v-if="ongoingRequests.length === 0" class="alert alert-info">
          You don't have any ongoing service requests.
        </div>

        <div v-for="request in ongoingRequests" :key="request.id" class="card mb-3 shadow-sm">
          <div class="card-body">
            <div class="row">
              <div class="col-md-8">
                <h5 class="card-title">{{ request.service_name }}</h5>
                <p class="card-text">
                  <strong>Requested on:</strong> {{ formatDate(request.date_of_request) }}<br>
                  <strong>Preferred Date:</strong> {{ formatDate(request.preferred_date) }}<br>
                  <strong>Preferred Time:</strong> {{ formatTimeSlot(request.preferred_time) }}<br>
                  <strong>Location:</strong> {{ request.location }} - {{ request.pin_code }}<br>
                  <strong>Status:</strong> <span class="badge bg-primary">{{ formatStatus(request.service_status) }}</span>
                </p>
                <p v-if="request.professional_name" class="card-text">
                  <strong>Assigned Professional:</strong> {{ request.professional_name }}
                </p>
                <p v-if="request.remarks" class="card-text"><strong>Remarks:</strong> {{ request.remarks }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Completed Requests Tab -->
      <div v-if="activeTab === 'completed'">
        <div v-if="completedRequests.length === 0" class="alert alert-info">
          You don't have any completed service requests.
        </div>

        <div v-for="request in completedRequests" :key="request.id" class="card mb-3 shadow-sm">
          <div class="card-body">
            <div class="row">
              <div class="col-md-8">
                <h5 class="card-title">{{ request.service_name }}</h5>
                <p class="card-text">
                  <strong>Requested on:</strong> {{ formatDate(request.date_of_request) }}<br>
                  <strong>Completed on:</strong> {{ formatDate(request.date_of_completion) }}<br>
                  <strong>Professional:</strong> {{ request.professional_name }}<br>
                  <strong>Status:</strong> <span class="badge bg-success">{{ formatStatus(request.service_status) }}</span>
                  <br v-if="request.professional_rating">
                  <strong v-if="request.professional_rating">Professional Rating:</strong>
                  <span v-if="request.professional_rating">
                    {{ request.professional_rating.toFixed(1) }} ★
                  </span>
                </p>
              </div>
              <div class="col-md-4 d-flex flex-column justify-content-center align-items-end">
                <button v-if="!request.has_review" @click="checkReviewStatus(request)" class="btn btn-outline-primary w-100">
                  Add Review
                </button>
                <div v-else class="text-success">
                  <i class="bi bi-check-circle"></i> Review submitted
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cancelled Requests Tab -->
      <div v-if="activeTab === 'cancelled'">
        <div v-if="cancelledRequests.length === 0" class="alert alert-info">
          You don't have any cancelled service requests.
        </div>

        <div v-for="request in cancelledRequests" :key="request.id" class="card mb-3 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">{{ request.service_name }}</h5>
            <p class="card-text">
              <strong>Requested on:</strong> {{ formatDate(request.date_of_request) }}<br>
              <strong>Status:</strong> <span class="badge bg-danger">Cancelled</span>
            </p>
            <p v-if="request.remarks" class="card-text"><strong>Remarks:</strong> {{ request.remarks }}</p>
          </div>
        </div>
      </div>

      <!-- Edit Request Modal -->
      <div class="modal fade" id="editRequestModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Service Request</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="updateRequest">
                <!-- Preferred Date -->
                <div class="mb-3">
                  <label for="editPreferredDate" class="form-label">Preferred Date</label>
                  <input type="date" class="form-control" id="editPreferredDate" v-model="editForm.preferredDate" required
                         :min="minDate">
                </div>

                <!-- Preferred Time -->
                <div class="mb-3">
                  <label for="editPreferredTime" class="form-label">Preferred Time</label>
                  <select class="form-select" id="editPreferredTime" v-model="editForm.preferredTime" required>
                    <option value="">Select a time slot</option>
                    <option value="morning">Morning (8:00 AM - 12:00 PM)</option>
                    <option value="afternoon">Afternoon (12:00 PM - 4:00 PM)</option>
                    <option value="evening">Evening (4:00 PM - 8:00 PM)</option>
                  </select>
                </div>

                <!-- Location -->
                <div class="mb-3">
                  <label for="editLocation" class="form-label">Location</label>
                  <input type="text" class="form-control" id="editLocation" v-model="editForm.location" required>
                </div>

                <!-- Pin Code -->
                <div class="mb-3">
                  <label for="editPinCode" class="form-label">Pin Code</label>
                  <input type="text" class="form-control" id="editPinCode" v-model="editForm.pinCode"
                         maxlength="6" pattern="[0-9]{6}" required>
                </div>

                <!-- Remarks -->
                <div class="mb-3">
                  <label for="editRemarks" class="form-label">Additional Remarks</label>
                  <textarea class="form-control" id="editRemarks" rows="3" v-model="editForm.remarks"></textarea>
                </div>

                <div v-if="editError" class="alert alert-danger">
                  {{ editError }}
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                    {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Review Modal -->
      <div class="modal fade" id="reviewModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Rate Your Experience</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="submitReview">
                <!-- Rating Stars -->
                <div class="mb-3 text-center">
                  <label class="form-label">Rating</label>
                  <div class="star-rating">
                    <span v-for="star in 5" :key="star"
                          @click="reviewForm.rating = star"
                          :class="{'selected': star <= reviewForm.rating}">
                      ★
                    </span>
                  </div>
                </div>

                <!-- Review Text -->
                <div class="mb-3">
                  <label for="reviewText" class="form-label">Your Review</label>
                  <textarea class="form-control" id="reviewText" rows="4" v-model="reviewForm.reviewText"
                            placeholder="Share your experience with the service"></textarea>
                </div>

                <div v-if="reviewError" class="alert alert-danger">
                  {{ reviewError }}
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" class="btn btn-primary" :disabled="isSubmitting || reviewForm.rating === 0">
                    {{ isSubmitting ? 'Submitting...' : 'Submit Review' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      activeTab: 'pending',
      serviceRequests: [],
      editForm: {
        id: null,
        preferredDate: '',
        preferredTime: '',
        location: '',
        pinCode: '',
        remarks: ''
      },
      reviewForm: {
        requestId: null,
        professionalId: null,
        rating: 0,
        reviewText: ''
      },
      editError: '',
      reviewError: '',
      isSubmitting: false,
      editModal: null,
      reviewModal: null,
      minDate: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
    };
  },

  computed: {
    pendingRequests() {
      return this.serviceRequests.filter(req => req.service_status === 'REQUESTED');
    },

    ongoingRequests() {
      return this.serviceRequests.filter(req => req.service_status === 'ASSIGNED');
    },

    completedRequests() {
      return this.serviceRequests.filter(req => req.service_status === 'CLOSED');
    },

    cancelledRequests() {
      return this.serviceRequests.filter(req => req.service_status === 'CANCELLED');
    }
  },

  mounted() {
    // Initialize modals
    this.$nextTick(() => {
      this.editModal = new bootstrap.Modal(document.getElementById('editRequestModal'));
      this.reviewModal = new bootstrap.Modal(document.getElementById('reviewModal'));
    });

    // Get user information
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.$router.push('/login');
      return;
    }

    this.fetchBookings();

    // Add CSS for star rating
    const style = document.createElement('style');
    style.textContent = `
      .star-rating {
        font-size: 2rem;
        color: #ccc;
      }
      .star-rating span {
        cursor: pointer;
        margin: 0 5px;
      }
      .star-rating span.selected {
        color: #ffc107;
      }
    `;
    document.head.appendChild(style);
  },

  methods: {
    fetchBookings() {
      const customerId = localStorage.getItem('userId');
      if (!customerId) return;

      axios.get(`http://127.0.0.1:5000/customers/${customerId}/service-requests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      .then(response => {
        this.serviceRequests = response.data.map(request => ({
          ...request,
          professional_rating: request.professional_rating,
          has_review: request.has_review
        }));
      })
      .catch(error => {
        console.error('Error fetching service requests:', error);
      });
    },

    checkReviewStatus(request) {
      // Before opening review modal, check if review already exists
      axios.get(`http://127.0.0.1:5000/service-requests/${request.id}/review`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      .then(response => {
        if (response.data.has_review) {
          alert('You have already submitted a review for this service request.');
          return;
        }
        this.openReviewModal(request);
      })
      .catch(error => {
        console.error('Error checking review status:', error);
        // Fallback to opening review modal if check fails
        this.openReviewModal(request);
      });
    },

    openEditModal(request) {
      this.editForm = {
        id: request.id,
        preferredDate: new Date(request.preferred_date).toISOString().split('T')[0],
        preferredTime: request.preferred_time,
        location: request.location,
        pinCode: request.pin_code,
        remarks: request.remarks || ''
      };
      this.editError = '';
      this.editModal.show();
    },

    openReviewModal(request) {
      this.reviewForm = {
        requestId: request.id,
        professionalId: request.professional_id,
        rating: 0,
        reviewText: ''
      };
      this.reviewError = '';
      this.reviewModal.show();
    },

    updateRequest() {
      this.isSubmitting = true;
      this.editError = '';

      const requestData = {
        preferred_date: new Date(this.editForm.preferredDate).toISOString(),
        preferred_time: this.editForm.preferredTime,
        location: this.editForm.location,
        pin_code: this.editForm.pinCode,
        remarks: this.editForm.remarks
      };

      axios.put(`http://127.0.0.1:5000/service-requests/${this.editForm.id}`, requestData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      .then(response => {
        this.editModal.hide();
        this.fetchBookings();
      })
      .catch(error => {
        console.error('Error updating service request:', error);
        this.editError = error.response?.data?.error || 'Error updating request. Please try again.';
      })
      .finally(() => {
        this.isSubmitting = false;
      });
    },

    cancelRequest(requestId) {
      if (!confirm('Are you sure you want to cancel this service request?')) {
        return;
      }

      axios.put(`http://127.0.0.1:5000/service-requests/${requestId}/cancel`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      .then(response => {
        this.fetchBookings();
        alert('Service request cancelled successfully!');
      })
      .catch(error => {
        console.error('Error cancelling service request:', error);
        alert(error.response?.data?.error || 'Error cancelling request. Please try again.');
      });
    },

    submitReview() {
      if (this.reviewForm.rating === 0) {
        this.reviewError = 'Please select a rating';
        return;
      }

      this.isSubmitting = true;
      this.reviewError = '';

      const reviewData = {
        service_request_id: this.reviewForm.requestId,
        professional_id: this.reviewForm.professionalId,
        customer_id: localStorage.getItem('userId'),
        rating: this.reviewForm.rating,
        review_text: this.reviewForm.reviewText
      };

      axios.post('http://127.0.0.1:5000/reviews', reviewData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      .then(response => {
        this.reviewModal.hide();
        this.fetchBookings();
        alert('Review submitted successfully!');
      })
      .catch(error => {
        console.error('Error submitting review:', error);
        this.reviewError = error.response?.data?.error || 'Error submitting review. Please try again.';
      })
      .finally(() => {
        this.isSubmitting = false;
      });
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },

    formatTimeSlot(timeSlot) {
      if (!timeSlot) return 'N/A';

      const timeMap = {
        'morning': 'Morning (8:00 AM - 12:00 PM)',
        'afternoon': 'Afternoon (12:00 PM - 4:00 PM)',
        'evening': 'Evening (4:00 PM - 8:00 PM)'
      };

      return timeMap[timeSlot] || timeSlot;
    },

    formatStatus(status) {
      if (!status) return 'Unknown';

      const statusMap = {
        'REQUESTED': 'Requested',
        'ASSIGNED': 'Assigned',
        'CLOSED': 'Completed',
        'CANCELLED': 'Cancelled'
      };

      return statusMap[status] || status;
    }
  }
};
