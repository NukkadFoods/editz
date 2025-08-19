import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  Edit3, 
  Download, 
  Image, 
  Type,
  ArrowRight 
} from 'lucide-react';
import UploadTest from '../components/UploadTest';

const Home: React.FC = () => {
  const features = [
    {
      icon: Upload,
      title: 'Upload Files',
      description: 'Upload PDF files or images to start editing',
      color: 'text-blue-600'
    },
    {
      icon: Edit3,
      title: 'Edit PDFs',
      description: 'Rotate, scale, reorder, and modify PDF pages',
      color: 'text-green-600'
    },
    {
      icon: Image,
      title: 'Image to PDF',
      description: 'Convert multiple images into a single PDF document',
      color: 'text-purple-600'
    },
    {
      icon: Type,
      title: 'Extract Text',
      description: 'Extract and copy text content from PDF files',
      color: 'text-orange-600'
    },
    {
      icon: Download,
      title: 'Download',
      description: 'Save your edited PDFs in high quality',
      color: 'text-red-600'
    }
  ];

  const steps = [
    {
      step: '1',
      title: 'Upload',
      description: 'Drag and drop your PDF or image files'
    },
    {
      step: '2',
      title: 'Edit',
      description: 'Use our tools to modify and enhance your documents'
    },
    {
      step: '3',
      title: 'Download',
      description: 'Save your processed PDF file'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Professional
            <span className="text-primary-600"> PDF Editor</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create, edit, and manage PDF documents with ease. Convert images to PDF, 
            extract text, manipulate pages, and more - all in your browser.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/editor"
              className="inline-flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Start Editing
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <button className="inline-flex items-center px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors duration-200">
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Powerful PDF Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to work with PDF documents, all in one place
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className={`w-12 h-12 ${feature.color} mb-4`}>
                  <feature.icon className="w-full h-full" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to create and edit your PDF documents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Editing?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust our PDF editor for their document needs
          </p>
          <Link
            to="/editor"
            className="inline-flex items-center px-8 py-3 bg-white hover:bg-gray-100 text-primary-600 font-medium rounded-lg transition-colors duration-200"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Upload Test Component */}
      <UploadTest />
    </div>
  );
};

export default Home;
