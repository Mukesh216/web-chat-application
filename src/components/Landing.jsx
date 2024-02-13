
import Login from './Auth/Login'
import SignUp from './Auth/SignUp'

const Landing = () => {



    return (
        <section className='w-full h-screen overflow-hidden'>
            <div className='w-full h-full relative'>

                <div className="absolute w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24  border-2 shadow-black border-white shadow-lg rounded-full left-8 top-4">
                    <img src="https://res.cloudinary.com/dfsvudyfv/image/upload/v1707752348/WhatsApp_Image_2024-02-12_at_21.04.27_898929a3-removebg-preview_imrmtr.png"
                        className='w-full h-full object-contain rounded-full' alt="logo" />
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-5 w-full h-full">

                    <div className='bg-[#070F2B] lg:col-span-3 h-full hidden md:block'>
                        <div className="w-full h-full ">



                            <div className='w-full h-full ps-10 flex justify-items-start items-center'>
                                <div>
                                    <h1 className='text-5xl lg:text-6xl w-fit text-white tracking-wider font-bold strok-text2'>Chat-RT</h1>
                                    <p className='text-white text-sm tracking-wider ps-44'><span className="text-blue-300">RealTime</span> Chat App</p>

                                    <p className='text-xl text-white mt-8 ps-2 '>
                                        connect with your Friends and Family
                                    </p>

                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='bg-sky-950 md:bg-[#637A9F] flex flex-col justify-center items-center w-full lg:col-span-2 h-full cursor-pointer'>
                        <div className='mb-8'>
                            <p className='py-2 font-bold text-5xl lg:text-6xl text-white strok-text'>Get Started</p>
                        </div>

                        <div className='flex flex-col sm:flex-row sm:space-x-5 lg:space-x-3 justify-center items-center space-y-3 sm:space-y-0'>
                            <Login />
                            <SignUp />
                        </div>
                    </div>

                </div>

            </div>

        </section>
    )
}

export default Landing