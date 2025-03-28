from unittest.mock import patch
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
import jwt

class AddFriendsTests(APITestCase):
    def setUp(self):
        """Set up the test environment."""
        self.testurl = reverse('add_friend')
        self.mock_jwt_payload = {'user_id': 1}  # Simulated payload for the JWT
        self.friend_id = 2  # Simulated friend ID

    @patch('jwt.decode')  # Mock the JWT decode function
    def test_add_a_friend(self, mock_jwt_decode):
        # Mock the decoded JWT payload to simulate authentication
        mock_jwt_decode.return_value = self.mock_jwt_payload
        # Include the JWT in the Authorization header
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')

        payload = {"id": self.friend_id}

        # Perform the POST request to add a friend
        response = self.client.post(self.testurl, payload, format='json')

        # Assert the expected status code
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")

        # Optionally, assert the response data
        self.assertIn('message', response.json(), "Response does not contain 'message'")
        self.assertEqual(response.json()['message'], 'Friend added successfully', "Unexpected response message")


    @patch('jwt.decode')
    def test_add_a_friend_already_in_friend_list(self, mock_jwt_decode):
        # Mock the decoded JWT payload to simulate authentication
        mock_jwt_decode.return_value = self.mock_jwt_payload
        # Include the JWT in the Authorization header
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')

        payload = {"id": self.friend_id}

        # Perform the POST request to add a friend
        response = self.client.post(self.testurl, payload, format='json')

        # Assert the expected status code
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")
        response = self.client.post(self.testurl, payload, format='json')

        # Assert the expected status code
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT, f"Expected status 409, got {response.status_code}")

        # Optionally, assert the response data
        self.assertIn('message', response.json(), "Response does not contain 'message'")
        self.assertEqual(response.json()['message'], 'user already in friend list', "Unexpected response message")

    @patch('jwt.decode')  # Mock the JWT decode function
    def test_add_a_friend_invalid_payload(self, mock_jwt_decode):
        # Mock the decoded JWT payload to simulate authentication
        mock_jwt_decode.return_value = self.mock_jwt_payload
        # Include the JWT in the Authorization header
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')

        payload = {"idd": self.friend_id}

        # Perform the POST request to add a friend
        response = self.client.post(self.testurl, payload, format='json')

        # Assert the expected status code
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, f"Expected status 400, got {response.status_code}")

    @patch('jwt.decode')  # Mock the JWT decode function
    def test_add_a_friend_invalid_method(self, mock_jwt_decode):
        # Mock the decoded JWT payload to simulate authentication
        mock_jwt_decode.return_value = self.mock_jwt_payload
        # Include the JWT in the Authorization header
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')

        payload = {"idd": self.friend_id}

        # Perform the POST request to add a friend
        response = self.client.get(self.testurl, payload, format='json')

        # Assert the expected status code
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED, f"Expected status 401, got {response.status_code}")

    @patch('jwt.decode')  # Mock the JWT decode function
    def test_add_a_friend_invalid_jwt(self, mock_jwt_decode):
        # Simulate an invalid JWT by raising an exception when jwt.decode is called
        mock_jwt_decode.side_effect = jwt.exceptions.InvalidTokenError("Invalid token")

        # Include the JWT in the Authorization header
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')

        payload = {"id": self.friend_id}

        # Perform the POST request to add a friend
        response = self.client.post(self.testurl, payload, format='json')

        # Assert the expected status code (e.g., 401 Unauthorized or 403 Forbidden depending on your API design)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, f"Expected status 401, got {response.status_code}")

        # Optionally, assert the response data for an appropriate error message
        self.assertEqual(response.json()['detail'], 'Given token not valid for any token type')



class RemoveFriendsTests(APITestCase):
    def setUp(self):
        """Set up the test environment."""
        self.testurl = reverse('remove_friend')
        self.testurladd = reverse('add_friend')
        self.mock_jwt_payload = {'user_id': 1}  # Simulated payload for the JWT
        self.friend_id = 2  # Simulated friend ID

    @patch('jwt.decode')  # Mock the JWT decode function
    def test_remove_a_friend(self, mock_jwt_decode):
        # Mock the decoded JWT payload to simulate authentication
        mock_jwt_decode.return_value = self.mock_jwt_payload
        # Include the JWT in the Authorization header
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')

        payload = {"id": self.friend_id}

        # Perform the POST request to add a friend
        response = self.client.post(self.testurladd, payload, format='json')

        # Assert the expected status code
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")

        response = self.client.delete(self.testurl, payload, format='json')

        # Assert the expected status code
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")

        # Optionally, assert the response data
        self.assertIn('message', response.json(), "Response does not contain 'message'")
        self.assertEqual(response.json()['message'], 'Friend removed successfully', "Unexpected response message")


    @patch('jwt.decode')
    def test_remove_a_friend_not_in_friend_list(self, mock_jwt_decode):
        # Mock the decoded JWT payload to simulate authentication
        mock_jwt_decode.return_value = self.mock_jwt_payload
        # Include the JWT in the Authorization header
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')

        payload = {"id": self.friend_id}

        response = self.client.delete(self.testurl, payload, format='json')

        # Assert the expected status code
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, f"Expected status 404, got {response.status_code}")

        # Optionally, assert the response data
        self.assertIn('error', response.json(), "Response does not contain 'message'")
        self.assertEqual(response.json()['error'], 'user not in friend list', "Unexpected response message")

    @patch('jwt.decode')  # Mock the JWT decode function
    def test_remove_a_friend_invalid_payload(self, mock_jwt_decode):
        # Mock the decoded JWT payload to simulate authentication
        mock_jwt_decode.return_value = self.mock_jwt_payload
        # Include the JWT in the Authorization header
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')

        payload = {"id": self.friend_id}

        # Perform the POST request to add a friend
        response = self.client.post(self.testurladd, payload, format='json')

        # Assert the expected status code
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")
        payload = {"idd": self.friend_id}
        response = self.client.delete(self.testurl, payload, format='json')

        # Assert the expected status code
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, f"Expected status 400, got {response.status_code}")

    @patch('jwt.decode')  # Mock the JWT decode function
    def test_remove_a_friend_invalid_method(self, mock_jwt_decode):
        # Mock the decoded JWT payload to simulate authentication
        mock_jwt_decode.return_value = self.mock_jwt_payload
        # Include the JWT in the Authorization header
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')

        payload = {"id": self.friend_id}

        # Perform the POST request to add a friend
        response = self.client.post(self.testurladd, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")
        response = self.client.post(self.testurl, payload, format='json')
        # Assert the expected status code
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED, f"Expected status 405, got {response.status_code}")

    @patch('jwt.decode')  # Mock the JWT decode function
    def test_remove_a_friend_invalid_jwt(self, mock_jwt_decode):
        mock_jwt_decode.return_value = self.mock_jwt_payload
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')

        payload = {"id": self.friend_id}
        response = self.client.post(self.testurladd, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")


        mock_jwt_decode.side_effect = jwt.exceptions.InvalidTokenError("Invalid token")
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        response = self.client.delete(self.testurl, payload, format='json')
        # Assert the expected status code (e.g., 401 Unauthorized or 403 Forbidden depending on your API design)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, f"Expected status 401, got {response.status_code}")

        # Optionally, assert the response data for an appropriate error message
        self.assertEqual(response.json()['detail'], 'Given token not valid for any token type')


class FriendsListTests(APITestCase):
    @patch('jwt.decode')
    def setUp(self, mock_jwt_decode):
        """Set up the test environment."""
        self.testurl = reverse('friends_list')
        self.mock_jwt_payload = {'user_id': 1}  # Simulated payload for the JWT
        mock_jwt_decode.return_value = self.mock_jwt_payload
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        payload = {"id": "2"}
        self.client.post(reverse('add_friend'), payload, format='json')

    @patch('jwt.decode')  # Mock the JWT decode function
    def test_view_friends_list(self, mock_jwt_decode):
        # Mock the decoded JWT payload to simulate authentication
        mock_jwt_decode.return_value = self.mock_jwt_payload
        # Include the JWT in the Authorization header
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')

        # Perform the POST request to add a friend
        response = self.client.get(self.testurl)

        # Assert the expected status code
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected status 200, got {response.status_code}")

    @patch('jwt.decode')  # Mock the JWT decode function
    def test_view_friends_list_invalid_method(self, mock_jwt_decode):
        # Mock the decoded JWT payload to simulate authentication
        mock_jwt_decode.return_value = self.mock_jwt_payload
        # Include the JWT in the Authorization header
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        payload = {"id": "2"}
        # Perform the POST request to add a friend
        response = self.client.post(self.testurl, payload, format='json')

        # Assert the expected status code
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED, f"Expected status 405, got {response.status_code}")

    @patch('jwt.decode')  # Mock the JWT decode function
    def test_view_friends_list_invalid_jwt(self, mock_jwt_decode):
        mock_jwt_decode.side_effect = jwt.exceptions.InvalidTokenError("Invalid token")
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        # Perform the POST request to add a friend
        response = self.client.get(self.testurl)

        # Assert the expected status code
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, f"Expected status 401, got {response.status_code}")

    @patch('jwt.decode')  # Mock the JWT decode function
    def test_view_friends_empty_list(self, mock_jwt_decode):
        # Mock the decoded JWT payload to simulate authentication
        mock_jwt_decode.return_value = self.mock_jwt_payload
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        payload = {"id": "2"}
        response = self.client.delete(reverse('remove_friend'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected remove status 200, got {response.status_code}")
        # Perform the POST request to add a friend
        mock_jwt_decode.return_value = self.mock_jwt_payload
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dummy_token')
        response = self.client.get(self.testurl)

        # Assert the expected status code
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected remove status 200, got {response.status_code}")
