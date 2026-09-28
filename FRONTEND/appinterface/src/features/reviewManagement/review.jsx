import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:2026';

export async function createReview(reviewPayload) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/rating/review/post`,
      reviewPayload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      'Failed to create review.';
    throw new Error(message);
  }
}

export async function fetchReviews() {
  try {
    const response = await axios.get(`${API_BASE_URL}/rating/reviews/get`);
    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      'Failed to fetch reviews.';
    throw new Error(message);
  }
}

export async function fetchReviewById(reviewId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/rating/review/get/${reviewId}`);
    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      'Failed to fetch review.';
    throw new Error(message);
  }
}

export async function updateReview(reviewId, reviewPayload) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/rating/review/update/${reviewId}`,
      reviewPayload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      'Failed to update review.';
    throw new Error(message);
  }
}

export default function ReviewManager() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    product_id: 1,
    user_id: 1,
    rating: 5,
    comment: '',
  });

  const [selectedReviewId, setSelectedReviewId] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await fetchReviews();
      setReviews(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'product_id' || name === 'user_id' || name === 'rating' ? Number(value) : value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      await createReview(form);
      setForm((prev) => ({ ...prev, comment: '' }));
      await loadReviews();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!selectedReviewId) {
      setError('Please select a review ID to update.');
      return;
    }

    try {
      setLoading(true);
      await updateReview(selectedReviewId, form);
      setError('');
      await loadReviews();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchOne = async () => {
    if (!selectedReviewId) {
      setError('Please enter a review ID.');
      return;
    }

    try {
      setLoading(true);
      const review = await fetchReviewById(selectedReviewId);
      setForm({
        product_id: review.product_id,
        user_id: review.user_id,
        rating: review.rating,
        comment: review.comment,
      });
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Review Manager</h2>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label>
            Product ID
            <input type="number" name="product_id" value={form.product_id} onChange={handleChange} />
          </label>
          <label>
            User ID
            <input type="number" name="user_id" value={form.user_id} onChange={handleChange} />
          </label>
          <label>
            Rating
            <input type="number" name="rating" min="1" max="5" value={form.rating} onChange={handleChange} />
          </label>
        </div>

        <label>
          Comment
          <textarea
            name="comment"
            rows="4"
            value={form.comment}
            onChange={handleChange}
            placeholder="Write your review"
          />
        </label>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="submit" disabled={loading}>Create review</button>
          <button type="button" onClick={handleFetchOne} disabled={loading}>Get review by ID</button>
          <button type="button" onClick={handleUpdate} disabled={loading}>Update review</button>
        </div>
      </form>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <label>
          Review ID
          <input
            type="number"
            value={selectedReviewId}
            onChange={(e) => setSelectedReviewId(e.target.value)}
            placeholder="Enter review id"
          />
        </label>
      </div>

      <h3>All reviews</h3>
      {loading ? <p>Loading...</p> : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
          {reviews.map((review) => (
            <li
              key={review.id}
              style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}
              onClick={() => setSelectedReviewId(review.id)}
            >
              <strong>#{review.id}</strong> · Product {review.product_id} · User {review.user_id}
              <div>Rating: {review.rating}/5</div>
              <div>{review.comment}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
