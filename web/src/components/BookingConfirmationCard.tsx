import { format, parseISO } from 'date-fns';
import { requestClose } from '../hooks/useOpenAiGlobal';
import type { BookingConfirmationToolOutput } from '../types';

interface BookingConfirmationCardProps {
  data: BookingConfirmationToolOutput;
}

export function BookingConfirmationCard({ data }: BookingConfirmationCardProps) {
  const { booking } = data;

  const formattedDate = booking.scheduledDate
    ? format(parseISO(booking.scheduledDate), 'EEEE, MMMM d, yyyy')
    : booking.scheduledDate;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
          {data.message && (
            <p className="text-sm text-gray-500">{data.message}</p>
          )}
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
        {booking.confirmationNumber && (
          <div className="flex justify-between items-center border-b border-green-200 pb-2">
            <span className="text-sm text-gray-600">Confirmation #</span>
            <span className="font-mono font-bold text-green-700">{booking.confirmationNumber}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Customer</p>
            <p className="font-medium text-gray-900">{booking.customerName}</p>
          </div>
          <div>
            <p className="text-gray-500">Phone</p>
            <p className="font-medium text-gray-900">{booking.phone}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Address</p>
            <p className="font-medium text-gray-900">{booking.address}</p>
          </div>
          <div>
            <p className="text-gray-500">Service</p>
            <p className="font-medium text-gray-900">{booking.serviceType}</p>
          </div>
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-medium text-gray-900">{formattedDate}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Time</p>
            <p className="font-medium text-gray-900">{booking.scheduledTime}</p>
            {booking.estimatedArrival && (
              <p className="text-xs text-gray-500">Est. arrival: {booking.estimatedArrival}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {data.cta && (
          <button
            onClick={() => {
              if (data.cta?.action === 'close') {
                requestClose();
              }
            }}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {data.cta.label}
          </button>
        )}
        <button
          onClick={() => requestClose()}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Close
        </button>
      </div>

      <p className="mt-4 text-xs text-center text-gray-500">
        Questions? Call us at (617) 479-9911
      </p>
    </div>
  );
}
