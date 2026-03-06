import axios from "axios";

const djangoClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_DJANGO_API_URL || "https://admin.gogevgelija.com",
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "en",
  },
});

export default djangoClient;
