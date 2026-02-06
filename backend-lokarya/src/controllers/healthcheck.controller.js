import { ApiResponse } from "../utils/api-response.js";
import {asyncHandler} from "../utils/async-handler.js";

// export const healthcheck =async (req, res) => {
//   try {

// const user = await getUserFromDB()
//     res
//     .status(200)
//     .json(new ApiResponse(200,{ message:"API is working fine"}));
//   } catch (error) {
//     next(error);
//   }
// }; 

const healthCheck = asyncHandler(async(req,res)=>{
  res
  .status(200)
  .json(new ApiResponse(200,{ message:"Server is healthy"}));
})

export { healthCheck };